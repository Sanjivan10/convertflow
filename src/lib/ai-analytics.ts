import "server-only";
import { prisma } from "@/lib/prisma";
import {
  AI_PLATFORMS,
  aiPlatformForVisit,
  aiPlatformName,
  likelyPrompts,
  type AiBotKind,
} from "@/lib/ai-sources";

export type AiStats = {
  days: number;
  totalVisits: number;
  liveFetches: number;
  platforms: { id: string; name: string; visits: number; liveFetches: number }[];
  landingPages: { path: string; count: number; platforms: string[] }[];
  fetchedPages: { path: string; count: number; bots: string[] }[];
  prompts: { prompt: string; path: string; platforms: string[]; score: number }[];
  crawlers: { bot: string; kind: AiBotKind; count: number }[];
};

const EMPTY: AiStats = {
  days: 30,
  totalVisits: 0,
  liveFetches: 0,
  platforms: AI_PLATFORMS.map((p) => ({ id: p.id, name: p.name, visits: 0, liveFetches: 0 })),
  landingPages: [],
  fetchedPages: [],
  prompts: [],
  crawlers: [],
};

function readMeta(m: string): Record<string, unknown> {
  try {
    const v = JSON.parse(m);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

type Bucket = { count: number; set: Set<string> };
const bump = (map: Map<string, Bucket>, key: string, tag: string, n = 1) => {
  const b = map.get(key) ?? { count: 0, set: new Set<string>() };
  b.count += n;
  b.set.add(tag);
  map.set(key, b);
};
const top = (map: Map<string, Bucket>, limit: number) =>
  [...map.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, limit);

/** AI referrals, AI fetches and estimated prompts for the last `days` days. */
export async function getAiStats(days = 30): Promise<AiStats> {
  try {
    const since = new Date(Date.now() - days * 86400_000);
    const [views, fetches] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: {
          type: "PAGEVIEW",
          createdAt: { gte: since },
          OR: [{ referrer: { not: null } }, { meta: { contains: '"utm"' } }],
        },
        select: { path: true, referrer: true, meta: true },
        take: 50_000,
      }),
      prisma.analyticsEvent.findMany({
        where: { type: "AI_FETCH", createdAt: { gte: since } },
        select: { path: true, meta: true },
        take: 50_000,
      }),
    ]);

    const visitsBy = new Map<string, number>();
    const liveBy = new Map<string, number>();
    const landing = new Map<string, Bucket>();
    const fetched = new Map<string, Bucket>();
    const crawlers = new Map<string, { kind: AiBotKind; count: number }>();
    let totalVisits = 0;
    let liveFetches = 0;

    for (const v of views) {
      const utm = readMeta(v.meta).utm;
      const p = aiPlatformForVisit(v.referrer, typeof utm === "string" ? utm : null);
      if (!p) continue;
      totalVisits++;
      visitsBy.set(p.id, (visitsBy.get(p.id) ?? 0) + 1);
      bump(landing, v.path, p.name);
    }

    for (const f of fetches) {
      const m = readMeta(f.meta);
      const bot = String(m.bot ?? "AI bot");
      const kind = (m.kind as AiBotKind) ?? "index";
      const platform = String(m.platform ?? "other");
      const c = crawlers.get(bot) ?? { kind, count: 0 };
      c.count++;
      crawlers.set(bot, c);
      if (kind === "live") {
        liveFetches++;
        liveBy.set(platform, (liveBy.get(platform) ?? 0) + 1);
        bump(fetched, f.path, aiPlatformName(platform));
      }
    }

    // Estimated prompts: weight pages by AI visits + live AI fetches.
    const pageScore = new Map<string, Bucket>();
    for (const [path, b] of landing) pageScore.set(path, { count: b.count, set: new Set(b.set) });
    for (const [path, b] of fetched) {
      const cur = pageScore.get(path) ?? { count: 0, set: new Set<string>() };
      cur.count += b.count;
      b.set.forEach((t) => cur.set.add(t));
      pageScore.set(path, cur);
    }
    const prompts = top(pageScore, 12).flatMap(([path, b]) =>
      likelyPrompts(path).map((prompt) => ({
        prompt,
        path,
        platforms: [...b.set],
        score: b.count,
      })),
    );

    return {
      days,
      totalVisits,
      liveFetches,
      platforms: AI_PLATFORMS.map((p) => ({
        id: p.id,
        name: p.name,
        visits: visitsBy.get(p.id) ?? 0,
        liveFetches: liveBy.get(p.id) ?? 0,
      })),
      landingPages: top(landing, 10).map(([path, b]) => ({ path, count: b.count, platforms: [...b.set] })),
      fetchedPages: top(fetched, 10).map(([path, b]) => ({ path, count: b.count, bots: [...b.set] })),
      prompts: prompts.slice(0, 15),
      crawlers: [...crawlers.entries()]
        .map(([bot, c]) => ({ bot, kind: c.kind, count: c.count }))
        .sort((a, b) => b.count - a.count),
    };
  } catch {
    return EMPTY;
  }
}
