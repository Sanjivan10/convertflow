import { notFound } from "next/navigation";
import Link from "next/link";
import { getToolByIdAdmin } from "@/lib/tools";
import { ToolForm } from "@/components/admin/tool-form";

export const dynamic = "force-dynamic";

export default async function EditTool({
  params,
  searchParams,
}: PageProps<"/admin/tool-builder/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const tool = await getToolByIdAdmin(id);
  if (!tool) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit tool</h1>
        {tool.status === "PUBLISHED" && (
          <Link
            href={`/convert/${tool.slug}`}
            target="_blank"
            className="text-sm text-sky-600 hover:underline"
          >
            View live →
          </Link>
        )}
      </div>
      {sp.saved && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40">
          Saved. Public pages and the sitemap have been revalidated.
        </p>
      )}
      <ToolForm tool={tool} />
    </div>
  );
}
