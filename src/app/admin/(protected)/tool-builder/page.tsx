import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { getAllToolsAdmin } from "@/lib/tools";
import { TOOL_CATALOG } from "@/lib/tool-catalog";
import { PDF_TOOLS } from "@/lib/pdf/catalog";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ToolBuilderList() {
  const tools = await getAllToolsAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tool Builder</h1>
          <p className="text-sm text-slate-500">
            Define converter routes, custom logic, and metadata — no deploy
            required.
          </p>
        </div>
        <Link href="/admin/tool-builder/new" className={buttonVariants()}>
          <Plus className="size-4" /> New tool
        </Link>
      </div>

      {tools.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
          The database has no tools yet, so the public site is serving{" "}
          {TOOL_CATALOG.length} built-in converters from the seed catalog. Run{" "}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">
            npm run db:seed
          </code>{" "}
          to import them, or create one now.
        </div>
      )}

      {tools.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3">Tool</th>
                <th className="px-4 py-3">Engine</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Conversions</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tools.map((tool) => (
                <tr
                  key={tool.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-950/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tool-builder/${tool.id}`}
                      className="font-medium text-sky-600 hover:underline"
                    >
                      {tool.name}
                    </Link>
                    <p className="text-xs text-slate-400">
                      /convert/{tool.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{tool.engine}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        tool.status === "PUBLISHED" ? "success" : "muted"
                      }
                    >
                      {tool.status.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-500">
                    {tool.conversionCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {formatDate(tool.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold">PDF Suite (27 tools)</h2>
        <p className="text-sm text-slate-500">
          Built-in PDF tools defined in code (<code className="rounded bg-slate-100 px-1 dark:bg-slate-800">src/lib/pdf/catalog.ts</code>)
          for full custom UI and processing. Editable by a developer; listed
          here for visibility and status.
        </p>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3">Tool</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Capability</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {PDF_TOOLS.map((tool) => (
                <tr key={tool.slug} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                  <td className="px-4 py-3 font-medium">{tool.name}</td>
                  <td className="px-4 py-3 text-slate-400">
                    /{tool.routePrefix}/{tool.slug}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="capitalize">
                      {tool.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        tool.capability === "client"
                          ? "success"
                          : tool.capability === "beta"
                            ? "default"
                            : "warning"
                      }
                    >
                      {tool.capability}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/${tool.routePrefix}/${tool.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-sky-600 hover:underline"
                    >
                      View <ExternalLink className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
