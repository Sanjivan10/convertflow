import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { canEditPost } from "@/lib/permissions";
import { getPostByIdAdmin } from "@/lib/blog";
import { BlogEditor } from "@/components/admin/blog-editor";

export const dynamic = "force-dynamic";

export default async function EditBlogPost({
  params,
  searchParams,
}: PageProps<"/admin/blogs/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();
  const post = await getPostByIdAdmin(id);
  if (!post) notFound();
  if (
    !session?.user ||
    !canEditPost(session.user.role, session.user.id, post.authorId)
  ) {
    redirect("/admin/blogs");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit post</h1>
        {post.status === "PUBLISHED" && (
          <Link
            href={`/blog/${post.slug}`}
            target="_blank"
            className="text-sm text-sky-600 hover:underline"
          >
            View live →
          </Link>
        )}
      </div>
      {sp.saved && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40">
          Saved.
        </p>
      )}
      <BlogEditor post={post} />
    </div>
  );
}
