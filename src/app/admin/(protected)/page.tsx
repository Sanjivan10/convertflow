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

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Traffic and file-processing metrics, updated live.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <h2 className="text-sm font-semibold text-slate-600">Top pages</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {stats.topPages.length === 0 && (
              <li className="py-6 text-center text-slate-400">No data yet.</li>
            )}
            {stats.topPages.map((p) => (
              <li key={p.path} className="flex justify-between">
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
    </div>
  );
}
