import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { can } from "@/lib/permissions";
import { getAllPostsAdmin } from "@/lib/blog";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminBlogList() {
  const session = await auth();
  const seeAll = can(session?.user.role, "manage:blogs");
  const posts = await getAllPostsAdmin(
    seeAll ? undefined : session?.user.id,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog CMS</h1>
          <p className="text-sm text-slate-500">
            {posts.length} post{posts.length === 1 ? "" : "s"}
            {seeAll ? "" : " (yours)"}
          </p>
        </div>
        <Link href="/admin/blogs/new" className={buttonVariants()}>
          <Plus className="size-4" /> New post
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400 dark:bg-slate-950">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {posts.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-slate-400">
                  No posts yet. Create your first one.
                </td>
              </tr>
            )}
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/blogs/${post.id}`}
                    className="font-medium text-sky-600 hover:underline"
                  >
                    {post.title}
                  </Link>
                  <p className="text-xs text-slate-400">/blog/{post.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={post.status === "PUBLISHED" ? "success" : "muted"}
                  >
                    {post.status.toLowerCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {formatDate(post.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
