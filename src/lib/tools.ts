import "server-only";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/utils";
import { TOOL_CATALOG, type ToolDef } from "@/lib/tool-catalog";
import type { FaqItem } from "@/lib/seo";

export type ToolView = {
  id: string;
  slug: string;
  name: string;
  category: string;
  fromFormat: string;
  toFormat: string;
  description: string;
  longDescription: string;
  accept: string;
  engine: "IMAGE" | "PDF" | "CUSTOM";
  customScript: string;
  status: "DRAFT" | "PUBLISHED";
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string[];
  ogImage: string | null;
  faq: FaqItem[];
  featured: boolean;
  conversionCount: number;
  updatedAt: string;
};

function fromCatalog(def: ToolDef): ToolView {
  return {
    id: `catalog:${def.slug}`,
    slug: def.slug,
    name: def.name,
    category: def.category,
    fromFormat: def.fromFormat,
    toFormat: def.toFormat,
    description: def.description,
    longDescription: def.longDescription,
    accept: def.accept,
    engine: def.engine,
    customScript: def.customScript ?? "",
    status: def.status,
    metaTitle: def.metaTitle ?? null,
    metaDescription: def.metaDescription ?? null,
    keywords: [],
    ogImage: null,
    faq: def.faq,
    featured: Boolean(def.featured),
    conversionCount: 0,
    updatedAt: new Date(0).toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(row: any): ToolView {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    fromFormat: row.fromFormat,
    toFormat: row.toFormat,
    description: row.description,
    longDescription: row.longDescription,
    accept: row.accept,
    engine: row.engine,
    customScript: row.customScript ?? "",
    status: row.status,
    metaTitle: row.metaTitle ?? null,
    metaDescription: row.metaDescription ?? null,
    keywords: parseJsonArray<string>(row.keywords),
    ogImage: row.ogImage ?? null,
    faq: parseJsonArray<FaqItem>(row.faq),
    featured: row.featured,
    conversionCount: row.conversionCount ?? 0,
    updatedAt: (row.updatedAt ?? new Date()).toISOString(),
  };
}

const catalogPublished = () =>
  TOOL_CATALOG.filter((t) => t.status === "PUBLISHED").map(fromCatalog);

export async function getPublishedTools(): Promise<ToolView[]> {
  try {
    const rows = await prisma.tool.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    });
    if (rows.length === 0) return catalogPublished();
    return rows.map(fromRow);
  } catch {
    return catalogPublished();
  }
}

export async function getFeaturedTools(limit = 8): Promise<ToolView[]> {
  const all = await getPublishedTools();
  const featured = all.filter((t) => t.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

export async function getToolBySlug(slug: string): Promise<ToolView | null> {
  try {
    const row = await prisma.tool.findUnique({ where: { slug } });
    if (row) return fromRow(row);
  } catch {
    // fall through to catalog
  }
  const def = TOOL_CATALOG.find((t) => t.slug === slug);
  return def ? fromCatalog(def) : null;
}

export async function getPublishedToolSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.tool.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
    if (rows.length) return rows.map((r) => r.slug);
  } catch {
    // fall through
  }
  return catalogPublished().map((t) => t.slug);
}

export async function getAllToolsAdmin(): Promise<ToolView[]> {
  const rows = await prisma.tool.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(fromRow);
}

export async function getToolByIdAdmin(id: string): Promise<ToolView | null> {
  const row = await prisma.tool.findUnique({ where: { id } });
  return row ? fromRow(row) : null;
}

export const TOOL_CATEGORIES = ["image", "pdf", "document"] as const;
