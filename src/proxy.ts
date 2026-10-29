import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { aiBotForUserAgent } from "@/lib/ai-sources";

// Two jobs:
// 1. First-line gate for the admin backend. Real authorization checks are
//    also performed in the admin layout and every admin server route / action.
// 2. Log page fetches by AI assistants (ChatGPT-User, Perplexity-User,
//    Claude-User…) for the dashboard's "AI search & citations" section. The
//    matcher only sends AI user-agents here, so normal visitors skip it.
export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  const isAdminArea =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!isAdminArea) {
    const bot = aiBotForUserAgent(request.headers.get("user-agent"));
    if (bot) {
      event.waitUntil(
        prisma.analyticsEvent
          .create({
            data: {
              type: "AI_FETCH",
              path: pathname.slice(0, 512),
              country: request.headers.get("x-vercel-ip-country") ?? null,
              meta: JSON.stringify({ bot: bot.label, platform: bot.platform, kind: bot.kind }),
            },
          })
          .catch(() => {
            /* logging is best-effort */
          }),
      );
      const res = NextResponse.next();
      res.headers.set("x-ai-fetch", bot.label);
      return res;
    }
    return NextResponse.next();
  }

  if (pathname === "/admin/login") return NextResponse.next();

  const session = await auth();

  if (!session?.user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    {
      // Pages (not assets, API or admin) requested by an AI assistant/crawler.
      source: "/((?!_next/|api/|admin|.*\\..*).*)",
      has: [
        {
          type: "header",
          key: "user-agent",
          value:
            ".*(ChatGPT-User|OAI-SearchBot|GPTBot|Perplexity|Claude|meta-external|DuckAssistBot|MistralAI-User|Amazonbot|Bytespider|cohere-ai).*",
        },
      ],
    },
  ],
};
