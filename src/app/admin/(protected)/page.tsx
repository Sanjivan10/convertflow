import Link from "next/link";
import { getDashboardStats } from "@/lib/analytics";
import { formatBytes, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/admin/stat-card";
import {
  TopToolsChart,
  TrafficChart,
} from "@/components/admin/dashboard-charts";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

/** "US" -> "🇺🇸 US". Vercel gives a 2-letter ISO code. */
function flag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return code;
  const base = 0x1f1e6;
  const cc = code.toUpperCase();
  return (
    String.fromCodePoint(base + cc.charCodeAt(0) - 65) +
    String.fromCodePoint(base + cc.charCodeAt(1) - 65) +
    " " +
    cc
  );
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  const countryTotal = stats.topCountries.reduce((a, c) => a + c.count, 0) || 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Traffic and file-processing metrics, updated live.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Pageviews (7d)"
          value={stats.pageviews7d.toLocaleString()}
          hint={`${stats.totalPageviews.toLocaleString()} all time`}
        />
        <StatCard
          label="Conversions (7d)"
          value={stats.conversions7d.toLocaleString()}
          hint={`${stats.totalConversions.toLocaleString()} all time`}
        />
        <StatCard
          label="Link clicks (7d)"
          value={stats.clicks7d.toLocaleString()}
          hint={`${stats.totalClicks.toLocaleString()} all time`}
        />
        <StatCard
          label="Searches (7d)"
          value={stats.searches7d.toLocaleString()}
          hint="on-site tool search"
        />
        <StatCard label="Published tools" value={stats.publishedTools} />
        <StatCard label="Published posts" value={stats.publishedPosts} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-600">
            Traffic — last 14 days
          </h2>
          <TrafficChart data={stats.daily} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-600">Top tools</h2>
          <TopToolsChart data={stats.topTools} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-600">
            Recent file processing
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2">Tool</th>
                  <th className="py-2">Size</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.recentConversions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No conversions logged yet.
                    </td>
                  </tr>
                )}
                {stats.recentConversions.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 font-medium">
                      {c.fromFormat}→{c.toFormat}
                    </td>
                    <td className="py-2 text-slate-500">
                      {formatBytes(c.fileSize)}
                    </td>
                    <td className="py-2">
                      <Badge variant={c.success ? "success" : "warning"}>
                        {c.success ? "ok" : "failed"}
                      </Badge>
                    </td>
                    <td className="py-2 text-slate-400">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-600">
            Top pages (visitors)
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {stats.topPages.length === 0 && (
              <li className="py-6 text-center text-slate-400">No data yet.</li>
            )}
            {stats.topPages.map((p) => (
              <li key={p.path} className="flex justify-between gap-3">
                <Link
                  href={p.path}
                  className="truncate text-sky-600 hover:underline"
                >
                  {p.path}
                </Link>
                <span className="tabular-nums text-slate-500">{p.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-600">
            Visitors by country
            <span className="ml-1 font-normal text-slate-400">· 30 days</span>
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {stats.topCountries.length === 0 && (
              <li className="py-6 text-center text-slate-400">
                No country data yet (populates once live on Vercel).
              </li>
            )}
            {stats.topCountries.map((c) => (
              <li key={c.country}>
                <div className="flex justify-between">
                  <span>{flag(c.country)}</span>
                  <span className="tabular-nums text-slate-500">
                    {c.count} ({Math.round((c.count / countryTotal) * 100)}%)
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${(c.count / countryTotal) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-600">
            Top on-site searches
            <span className="ml-1 font-normal text-slate-400">· 30 days</span>
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {stats.topQueries.length === 0 && (
              <li className="py-6 text-center text-slate-400">
                Nothing searched yet.
              </li>
            )}
            {stats.topQueries.map((q) => (
              <li key={q.query} className="flex justify-between gap-3">
                <span className="truncate">“{q.query}”</span>
                <span className="tabular-nums text-slate-500">{q.count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-400">
            Queries with no matching tool are opportunities to add one.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-600">
            Most-clicked tools
            <span className="ml-1 font-normal text-slate-400">· 30 days</span>
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {stats.topClickTargets.length === 0 && (
              <li className="py-6 text-center text-slate-400">
                No clicks recorded yet.
              </li>
            )}
            {stats.topClickTargets.map((t) => (
              <li key={t.target} className="flex justify-between gap-3">
                <span className="truncate">{t.target.replace(/^tool:/, "")}</span>
                <span className="tabular-nums text-slate-500">{t.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
