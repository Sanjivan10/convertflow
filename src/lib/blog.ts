import "server-only";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/utils";
import type { FaqItem } from "@/lib/seo";

export type PostView = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  coverImage: string | null;
  status: "DRAFT" | "PUBLISHED";
  metaTitle: string | null;
  metaDescription: string | null;
  faq: FaqItem[];
  tags: string[];
  keywords: string[];
  authorId: string | null;
  authorName: string | null;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(row: any): PostView {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    contentHtml: row.contentHtml ?? "",
    coverImage: row.coverImage ?? null,
    status: row.status,
    metaTitle: row.metaTitle ?? null,
    metaDescription: row.metaDescription ?? null,
    faq: parseJsonArray<FaqItem>(row.faq),
    tags: parseJsonArray<string>(row.tags),
    keywords: parseJsonArray<string>(row.keywords),
    authorId: row.authorId ?? null,
    authorName: row.author?.name ?? null,
    publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : null,
    updatedAt: new Date(row.updatedAt ?? Date.now()).toISOString(),
    createdAt: new Date(row.createdAt ?? Date.now()).toISOString(),
  };
}

export async function getPublishedPosts(): Promise<PostView[]> {
  try {
    const rows = await prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      include: { author: { select: { name: true } } },
    });
    return rows.map(fromRow);
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<PostView | null> {
  try {
    const row = await prisma.post.findUnique({
      where: { slug },
      include: { author: { select: { name: true } } },
    });
    return row ? fromRow(row) : null;
  } catch {
    return null;
  }
}

export async function getPublishedPostSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
    return rows.map((r) => r.slug);
  } catch {
    return [];
  }
}

export async function getAllPostsAdmin(
  authorId?: string,
): Promise<PostView[]> {
  const rows = await prisma.post.findMany({
    where: authorId ? { authorId } : undefined,
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { name: true } } },
  });
  return rows.map(fromRow);
}

export async function getPostByIdAdmin(id: string): Promise<PostView | null> {
  const row = await prisma.post.findUnique({
    where: { id },
    include: { author: { select: { name: true } } },
  });
  return row ? fromRow(row) : null;
}
