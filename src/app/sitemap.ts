import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { getPublishedToolSlugs } from "@/lib/tools";
import { getPublishedPosts } from "@/lib/blog";
import { PDF_TOOLS } from "@/lib/pdf/catalog";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [toolSlugs, posts] = await Promise.all([
    getPublishedToolSlugs(),
    getPublishedPosts(),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: absoluteUrl("/tools"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const toolRoutes: MetadataRoute.Sitemap = toolSlugs.map((slug) => ({
    url: absoluteUrl(`/convert/${slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const pdfToolRoutes: MetadataRoute.Sitemap = PDF_TOOLS.map((tool) => ({
    url: absoluteUrl(`/${tool.routePrefix}/${tool.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: tool.featured ? 0.85 : 0.75,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...toolRoutes, ...pdfToolRoutes, ...postRoutes];
}
