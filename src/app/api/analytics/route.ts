import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_PATH = 512;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = body?.type === "CONVERSION" ? "CONVERSION" : "PAGEVIEW";
    const path = String(body?.path ?? "/").slice(0, MAX_PATH);
    const toolSlug = body?.toolSlug ? String(body.toolSlug).slice(0, 128) : null;
    const referrer = body?.referrer
      ? String(body.referrer).slice(0, MAX_PATH)
      : null;

    await prisma.analyticsEvent.create({
      data: {
        type,
        path,
        toolSlug,
        referrer,
        country: request.headers.get("x-vercel-ip-country") ?? null,
        meta: JSON.stringify(
          body?.meta && typeof body.meta === "object" ? body.meta : {},
        ),
      },
    });
  } catch {
    // Analytics is best-effort — never surface an error to the client.
  }
  return new NextResponse(null, { status: 204 });
}
