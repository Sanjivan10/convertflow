import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const toolSlug = String(body?.toolSlug ?? "").slice(0, 128);
    if (!toolSlug) return new NextResponse(null, { status: 204 });

    const success = body?.success !== false;

    await prisma.$transaction([
      prisma.conversionLog.create({
        data: {
          toolSlug,
          fromFormat: String(body?.fromFormat ?? "").slice(0, 32),
          toFormat: String(body?.toFormat ?? "").slice(0, 32),
          fileName: body?.fileName ? String(body.fileName).slice(0, 256) : null,
          fileSize: Number.isFinite(body?.fileSize) ? Number(body.fileSize) : 0,
          durationMs: Number.isFinite(body?.durationMs)
            ? Number(body.durationMs)
            : 0,
          success,
          error: body?.error ? String(body.error).slice(0, 512) : null,
        },
      }),
      ...(success
        ? [
            prisma.tool.updateMany({
              where: { slug: toolSlug },
              data: { conversionCount: { increment: 1 } },
            }),
          ]
        : []),
    ]);
  } catch {
    // best-effort
  }
  return new NextResponse(null, { status: 204 });
}
