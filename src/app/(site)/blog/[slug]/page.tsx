import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getPostBySlug, getPublishedPostSlugs } from "@/lib/blog";
import {
  articleSchema,
  breadcrumbSchema,
  buildMetadata,
  faqPageSchema,
  jsonLdScript,
  type Crumb,
} from "@/lib/seo";
import { formatDate, readingTime } from "@/lib/utils";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FaqSection } from "@/components/faq-section";
import { AdZone } from "@/components/ad-zone";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPublishedPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  return buildMetadata({
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt,
    path: `/blog/${post.slug}`,
    type: "article",
    ogImage: post.coverImage ?? undefined,
    keywords: post.keywords.length ? post.keywords : post.tags,
    publishedTime: post.publishedAt ?? undefined,
    modifiedTime: post.updatedAt,
    noindex: post.status !== "PUBLISHED",
  });
}

export default async function BlogPostPage({
  params,
}: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== "PUBLISHED") notFound();

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          articleSchema({
            title: post.title,
            description: post.metaDescription ?? post.excerpt,
            path: `/blog/${post.slug}`,
            image: post.coverImage ?? undefined,
            publishedTime: post.publishedAt ?? undefined,
            modifiedTime: post.updatedAt,
            authorName: post.authorName ?? undefined,
          }),
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(breadcrumbSchema(crumbs))}
      />
      {post.faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(faqPageSchema(post.faq))}
        />
      )}

      <Breadcrumbs items={crumbs} />

      <header className="mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          {post.publishedAt ? formatDate(post.publishedAt) : "Unpublished"}
          {post.authorName ? ` · ${post.authorName}` : ""} ·{" "}
          {readingTime(post.contentHtml.replace(/<[^>]+>/g, " "))} min read
        </p>
      </header>

      {post.coverImage && (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      <AdZone zone="blog-top" format="leaderboard" className="my-8" />

      <div
        className="article mt-8 text-slate-700 dark:text-slate-200"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      <FaqSection items={post.faq} />

      <AdZone zone="blog-bottom" format="rectangle" className="mt-10" />
    </article>
  );
}
