import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { AdZone } from "@/components/ad-zone";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Blog",
  description:
    "Guides and explainers on file formats, image compression, PDF workflows, and getting the most out of ConvertFlow.",
  path: "/blog",
});

export default async function BlogIndex() {
  const posts = await getPublishedPosts();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Blog</h1>
      <p className="mt-2 text-slate-500">
        File-format guides, compression tips, and product updates.
      </p>

      {posts.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
          No published posts yet. Add one from the admin CMS.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="rounded-xl border border-slate-200 p-6 transition-colors hover:border-sky-300 dark:border-slate-800"
            >
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-bold text-slate-900 hover:text-sky-700 dark:text-white">
                  {post.title}
                </h2>
              </Link>
              <p className="mt-1 text-xs text-slate-400">
                {post.publishedAt ? formatDate(post.publishedAt) : "Draft"}
                {post.authorName ? ` · ${post.authorName}` : ""}
              </p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {post.excerpt}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-3 inline-block text-sm font-medium text-sky-600 hover:underline"
              >
                Read more →
              </Link>
            </article>
          ))}
        </div>
      )}

      <AdZone zone="blog-top" format="leaderboard" className="mt-10" />
    </div>
  );
}
