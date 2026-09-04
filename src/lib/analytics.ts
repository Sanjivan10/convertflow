import "server-only";
import { prisma } from "@/lib/prisma";

export type DashboardStats = {
  totalPageviews: number;
  totalConversions: number;
  pageviews7d: number;
  conversions7d: number;
  clicks7d: number;
  totalClicks: number;
  searches7d: number;
  publishedTools: number;
  publishedPosts: number;
  daily: { date: string; pageviews: number; conversions: number }[];
  topTools: { toolSlug: string; count: number }[];
  topPages: { path: string; count: number }[];
  topCountries: { country: string; count: number }[];
  topQueries: { query: string; count: number }[];
  topClickTargets: { target: string; count: number }[];
  recentConversions: {
    id: string;
    toolSlug: string;
    fromFormat: string;
    toFormat: string;
    fileName: string | null;
    fileSize: number;
    success: boolean;
    createdAt: string;
  }[];
};

function emptyStats(): DashboardStats {
  const daily = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return { date: d.toISOString().slice(0, 10), pageviews: 0, conversions: 0 };
  });
  return {
    totalPageviews: 0,
    totalConversions: 0,
    pageviews7d: 0,
    conversions7d: 0,
    clicks7d: 0,
    totalClicks: 0,
    searches7d: 0,
    publishedTools: 0,
    publishedPosts: 0,
    daily,
    topTools: [],
    topPages: [],
    topCountries: [],
    topQueries: [],
    topClickTargets: [],
    recentConversions: [],
  };
}

function tally<T>(items: T[], key: (t: T) => string | null | undefined, limit: number) {
  const map = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k, count]) => ({ k, count }));
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const now = new Date();
    const since14 = new Date(now);
    since14.setDate(now.getDate() - 13);
    since14.setHours(0, 0, 0, 0);
    const since7 = new Date(now);
    since7.setDate(now.getDate() - 7);

    const since30 = new Date(now);
    since30.setDate(now.getDate() - 30);

    const [
      totalPageviews,
      totalConversions,
      pageviews7d,
      conversions7d,
      clicks7d,
      totalClicks,
      searches7d,
      publishedTools,
      publishedPosts,
      events,
      topToolsRaw,
      topPagesRaw,
      topCountriesRaw,
      searchEvents,
      clickEvents,
      recentConversions,
    ] = await Promise.all([
      prisma.analyticsEvent.count({ where: { type: "PAGEVIEW" } }),
      prisma.analyticsEvent.count({ where: { type: "CONVERSION" } }),
      prisma.analyticsEvent.count({
        where: { type: "PAGEVIEW", createdAt: { gte: since7 } },
      }),
      prisma.analyticsEvent.count({
        where: { type: "CONVERSION", createdAt: { gte: since7 } },
      }),
      prisma.analyticsEvent.count({
        where: { type: "CLICK", createdAt: { gte: since7 } },
      }),
      prisma.analyticsEvent.count({ where: { type: "CLICK" } }),
      prisma.analyticsEvent.count({
        where: { type: "SEARCH", createdAt: { gte: since7 } },
      }),
      prisma.tool.count({ where: { status: "PUBLISHED" } }),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since14 } },
        select: { type: true, createdAt: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["toolSlug"],
        where: { type: "CONVERSION", toolSlug: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { toolSlug: "desc" } },
        take: 6,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["path"],
        where: { type: "PAGEVIEW" },
        _count: { _all: true },
        orderBy: { _count: { path: "desc" } },
        take: 8,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["country"],
        where: { country: { not: null }, createdAt: { gte: since30 } },
        _count: { _all: true },
        orderBy: { _count: { country: "desc" } },
        take: 10,
      }),
      prisma.analyticsEvent.findMany({
        where: { type: "SEARCH", createdAt: { gte: since30 } },
        select: { meta: true },
        take: 5000,
      }),
      prisma.analyticsEvent.findMany({
        where: { type: "CLICK", createdAt: { gte: since30 } },
        select: { meta: true },
        take: 5000,
      }),
      prisma.conversionLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);

    const readMeta = (m: unknown): Record<string, unknown> => {
      if (typeof m !== "string") return {};
      try {
        const v = JSON.parse(m);
        return v && typeof v === "object" ? v : {};
      } catch {
        return {};
      }
    };
    const topQueries = tally(
      searchEvents.map((e) => readMeta(e.meta)),
      (m) => (typeof m.query === "string" ? m.query : null),
      12,
    ).map((r) => ({ query: r.k, count: r.count }));
    const topClickTargets = tally(
      clickEvents.map((e) => readMeta(e.meta)),
      (m) => (typeof m.target === "string" ? m.target : null),
      10,
    ).map((r) => ({ target: r.k, count: r.count }));

    const dailyMap = new Map<
      string,
      { date: string; pageviews: number; conversions: number }
    >();
    for (let i = 0; i < 14; i++) {
      const d = new Date(since14);
      d.setDate(since14.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { date: key, pageviews: 0, conversions: 0 });
    }
    for (const ev of events) {
      const key = new Date(ev.createdAt).toISOString().slice(0, 10);
      const bucket = dailyMap.get(key);
      if (!bucket) continue;
      if (ev.type === "PAGEVIEW") bucket.pageviews += 1;
      else bucket.conversions += 1;
    }

    return {
      totalPageviews,
      totalConversions,
      pageviews7d,
      conversions7d,
      clicks7d,
      totalClicks,
      searches7d,
      publishedTools,
      publishedPosts,
      daily: [...dailyMap.values()],
      topTools: topToolsRaw
        .filter((t) => t.toolSlug)
        .map((t) => ({ toolSlug: t.toolSlug as string, count: t._count._all })),
      topPages: topPagesRaw.map((p) => ({
        path: p.path,
        count: p._count._all,
      })),
      topCountries: topCountriesRaw
        .filter((c) => c.country)
        .map((c) => ({ country: c.country as string, count: c._count._all })),
      topQueries,
      topClickTargets,
      recentConversions: recentConversions.map((c) => ({
        id: c.id,
        toolSlug: c.toolSlug,
        fromFormat: c.fromFormat,
        toFormat: c.toFormat,
        fileName: c.fileName,
        fileSize: c.fileSize,
        success: c.success,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  } catch {
    return emptyStats();
  }
}
