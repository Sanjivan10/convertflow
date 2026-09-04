import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_PATH = 512;
const TYPES = new Set(["PAGEVIEW", "CONVERSION", "SEARCH", "CLICK"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = TYPES.has(body?.type) ? body.type : "PAGEVIEW";
    const path = String(body?.path ?? "/").slice(0, MAX_PATH);
    const toolSlug = body?.toolSlug ? String(body.toolSlug).slice(0, 128) : null;
    const referrer = body?.referrer
      ? String(body.referrer).slice(0, MAX_PATH)
      : null;

    // Only keep small, known meta keys.
    const raw = body?.meta && typeof body.meta === "object" ? body.meta : {};
    const meta: Record<string, unknown> = {};
    if (typeof raw.query === "string") meta.query = raw.query.slice(0, 120);
    if (typeof raw.target === "string") meta.target = raw.target.slice(0, 160);
    if (typeof raw.toFormat === "string") meta.toFormat = raw.toFormat.slice(0, 32);
    if (typeof raw.op === "string") meta.op = raw.op.slice(0, 48);
    if (Number.isFinite(raw.count)) meta.count = Number(raw.count);

    await prisma.analyticsEvent.create({
      data: {
        type,
        path,
        toolSlug,
        referrer,
        // Vercel injects the visitor's country automatically at the edge.
        country: request.headers.get("x-vercel-ip-country") ?? null,
        meta: JSON.stringify(meta),
      },
    });
  } catch {
    // Analytics is best-effort — never surface an error to the client.
  }
  return new NextResponse(null, { status: 204 });
}
