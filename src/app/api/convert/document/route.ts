import { NextResponse } from "next/server";
import {
  ConversionError,
  OP_SPEC,
  isConversionConfigured,
  isServerConvOp,
  maxUploadBytes,
  runServerConversion,
} from "@/lib/convert/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// --- lightweight in-memory rate limit (best-effort; per serverless instance) ---
const HITS = new Map<string, { n: number; resetAt: number }>();
const WINDOW_MS = 10 * 60_000;
const LIMIT = 15;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = HITS.get(ip);
  if (!rec || now > rec.resetAt) {
    HITS.set(ip, { n: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.n += 1;
  return rec.n > LIMIT;
}

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET() {
  // Status probe used by the UI to decide whether to show the form.
  return NextResponse.json({ configured: isConversionConfigured(), maxBytes: maxUploadBytes() });
}

export async function POST(request: Request) {
  const started = Date.now();

  if (!isConversionConfigured()) {
    return NextResponse.json(
      {
        error:
          "Document conversion is not enabled on this site yet. An admin needs to set CONVERSION_PROVIDER and CONVERSION_API_KEY.",
        code: "not_configured",
      },
      { status: 503 },
    );
  }

  if (rateLimited(clientIp(request))) {
    return NextResponse.json(
      { error: "Too many conversions from your network. Wait a few minutes.", code: "rate_limited" },
      { status: 429 },
    );
  }

  let op = "";
  let filename: string | undefined;
  let fileSize = 0;
  try {
    const form = await request.formData();
    op = String(form.get("op") || "");
    if (!isServerConvOp(op)) {
      return NextResponse.json({ error: "Unknown conversion." }, { status: 400 });
    }
    const spec = OP_SPEC[op];

    let bytes: Uint8Array | undefined;
    let url: string | undefined;

    if (spec.kind === "url") {
      url = String(form.get("url") || "").trim();
      if (!url) {
        return NextResponse.json(
          { error: "Enter a web address to convert." },
          { status: 400 },
        );
      }
    } else {
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "No file was uploaded." },
          { status: 400 },
        );
      }
      filename = file.name;
      fileSize = file.size;
      if (file.size > maxUploadBytes()) {
        return NextResponse.json(
          {
            error: `File is larger than the ${Math.round(
              maxUploadBytes() / 1024 / 1024,
            )} MB limit.`,
            code: "too_large",
          },
          { status: 413 },
        );
      }
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (!spec.fromExts.includes(ext)) {
        return NextResponse.json(
          {
            error: `Unsupported file type ".${ext}". Allowed: ${spec.fromExts
              .map((e) => "." + e)
              .join(", ")}.`,
            code: "unsupported",
          },
          { status: 415 },
        );
      }
      bytes = new Uint8Array(await file.arrayBuffer());
    }

    const qRaw = form.get("quality");
    const quality = qRaw != null ? Number(qRaw) : undefined;
    const out = await runServerConversion({ op, bytes, filename, url, quality });

    // best-effort log; never blocks the response
    prisma.conversionLog
      .create({
        data: {
          toolSlug: op,
          fromFormat: filename?.split(".").pop()?.toLowerCase() || "url",
          toFormat: OP_SPEC[op].outExt,
          fileName: filename ?? url ?? null,
          fileSize,
          durationMs: Date.now() - started,
          success: true,
        },
      })
      .catch(() => {});

    // free the input buffer reference before streaming out
    bytes = undefined;

    return new NextResponse(out.bytes as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": out.contentType,
        "Content-Disposition": `attachment; filename="${out.filename.replace(/"/g, "")}"`,
        "Content-Length": String(out.bytes.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const status = err instanceof ConversionError ? err.status : 500;
    const message =
      err instanceof ConversionError
        ? err.message
        : "The conversion failed unexpectedly.";
    prisma.conversionLog
      .create({
        data: {
          toolSlug: op || "document",
          fromFormat: filename?.split(".").pop()?.toLowerCase() || "url",
          toFormat: "pdf",
          fileName: filename ?? null,
          fileSize,
          durationMs: Date.now() - started,
          success: false,
          error: message.slice(0, 500),
        },
      })
      .catch(() => {});
    return NextResponse.json({ error: message }, { status });
  }
}
