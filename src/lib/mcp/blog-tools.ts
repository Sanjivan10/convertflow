import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPostByIdAdmin, getPostBySlug } from "@/lib/blog";
import { slugify } from "@/lib/utils";
import { pingIndexNow } from "@/lib/indexnow";

/*
 * Blog tools exposed to Claude over MCP (see src/app/api/mcp/route.ts).
 * They write the same Post rows the admin panel does, so anything created
 * here shows up in /admin/blogs and can be edited there.
 */

const faqItem = z.object({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
});

const postFields = {
  title: z.string().trim().min(1).describe("Post title (H1)."),
  slug: z
    .string()
    .trim()
    .optional()
    .describe("URL slug. Defaults to a slug made from the title."),
  excerpt: z.string().trim().optional().describe("Short summary shown on the blog list."),
  contentHtml: z
    .string()
    .describe(
      "Post body as HTML (h2, h3, p, ul, ol, li, a, strong, em, blockquote, img). Do not include the H1 title.",
    ),
  coverImage: z.string().trim().optional().describe("Cover image URL (use upload_image first for external images)."),
  status: z
    .enum(["DRAFT", "PUBLISHED"])
    .optional()
    .describe("DRAFT (default) or PUBLISHED (live on the site)."),
  metaTitle: z.string().trim().optional().describe("SEO title, ~60 characters."),
  metaDescription: z.string().trim().optional().describe("SEO description, ~155 characters."),
  tags: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional().describe("SEO focus keywords."),
  faq: z.array(faqItem).optional().describe("FAQ shown on the post and as FAQPage schema."),
};

const schemas = {
  list_posts: z.object({
    status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
    search: z.string().optional().describe("Match against title or slug."),
    limit: z.number().int().min(1).max(100).optional(),
  }),
  get_post: z.object({
    id: z.string().optional(),
    slug: z.string().optional(),
  }),
  create_post: z.object(postFields),
  update_post: z.object({
    id: z.string().describe("Post id (from list_posts)."),
    ...z.object(postFields).partial().shape,
  }),
  delete_post: z.object({
    id: z.string(),
    confirm: z.literal(true).describe("Must be true. Deletion cannot be undone."),
  }),
  upload_image: z.object({
    url: z.string().url().optional().describe("Public image URL to copy into the site's storage."),
    base64: z.string().optional().describe("Image bytes as base64 (alternative to url)."),
    contentType: z
      .enum(["image/png", "image/jpeg", "image/webp", "image/gif"])
      .optional()
      .describe("Required with base64."),
  }),
} as const;

type ToolName = keyof typeof schemas;

const descriptions: Record<ToolName, string> = {
  list_posts: "List ConvertFlow blog posts (id, title, slug, status, dates).",
  get_post: "Get one blog post with full content, by id or slug.",
  create_post:
    "Create a blog post on ConvertFlow. Saved as DRAFT unless status is PUBLISHED.",
  update_post:
    "Update fields of an existing blog post. Only the fields you pass change. Set status to PUBLISHED to publish.",
  delete_post: "Permanently delete a blog post.",
  upload_image:
    "Upload an image (from a URL or base64) to the site's storage and return its public URL, for coverImage or <img> tags.",
};

export const toolDefinitions = (Object.keys(schemas) as ToolName[]).map((name) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { $schema, ...inputSchema } = z.toJSONSchema(schemas[name], {
    io: "input",
  }) as Record<string, unknown>;
  return { name, description: descriptions[name], inputSchema };
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const postUrl = (slug: string) => `${siteUrl}/blog/${slug}`;

async function revalidatePost(slug: string, published = false) {
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blogs");
  // Same as the admin panel: tell Bing/Yandex about newly published posts.
  if (published) await pingIndexNow(["/blog", `/blog/${slug}`, "/sitemap.xml"]);
}

const cleanList = (items?: string[], lower = false) =>
  (items ?? [])
    .map((s) => (lower ? s.trim().toLowerCase() : s.trim()))
    .filter(Boolean);

async function uniqueSlug(base: string, ignoreId?: string) {
  let slug = base || "post";
  for (let i = 2; ; i++) {
    const hit = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === ignoreId) return slug;
    slug = `${base}-${i}`;
  }
}

/** Posts created over MCP are attributed to MCP_AUTHOR_EMAIL, or the first admin. */
async function defaultAuthorId() {
  const email = process.env.MCP_AUTHOR_EMAIL;
  const user = email
    ? await prisma.user.findUnique({ where: { email }, select: { id: true } })
    : await prisma.user.findFirst({
        where: { role: "ADMIN" },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
  return user?.id ?? null;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function uploadImage(args: z.infer<typeof schemas.upload_image>) {
  let bytes: Buffer;
  let type: string;
  if (args.url) {
    const res = await fetch(args.url);
    if (!res.ok) throw new Error(`Could not download image (HTTP ${res.status}).`);
    type = (res.headers.get("content-type") || "").split(";")[0].trim();
    bytes = Buffer.from(await res.arrayBuffer());
  } else if (args.base64 && args.contentType) {
    type = args.contentType;
    bytes = Buffer.from(args.base64, "base64");
  } else {
    throw new Error("Pass either url, or base64 with contentType.");
  }
  if (!EXT[type]) throw new Error(`Unsupported image type "${type}". Use PNG, JPG, WebP or GIF.`);
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("Image must be 5 MB or smaller.");
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set, so images cannot be stored.");
  }
  const { put } = await import("@vercel/blob");
  const blob = await put(`uploads/${crypto.randomUUID()}.${EXT[type]}`, bytes, {
    access: "public",
    contentType: type,
    addRandomSuffix: false,
  });
  return { url: blob.url };
}

export function isToolName(name: string): name is ToolName {
  return name in schemas;
}

export async function callTool(name: ToolName, rawArgs: unknown): Promise<unknown> {
  switch (name) {
    case "list_posts": {
      const a = schemas.list_posts.parse(rawArgs ?? {});
      const rows = await prisma.post.findMany({
        where: {
          ...(a.status ? { status: a.status } : {}),
          ...(a.search
            ? {
                OR: [
                  { title: { contains: a.search, mode: "insensitive" } },
                  { slug: { contains: a.search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { updatedAt: "desc" },
        take: a.limit ?? 50,
        select: { id: true, title: true, slug: true, status: true, publishedAt: true, updatedAt: true },
      });
      return rows.map((r) => ({ ...r, url: postUrl(r.slug) }));
    }

    case "get_post": {
      const a = schemas.get_post.parse(rawArgs ?? {});
      const post = a.id
        ? await getPostByIdAdmin(a.id)
        : a.slug
          ? await getPostBySlug(a.slug)
          : null;
      if (!post) throw new Error("Post not found. Pass a valid id or slug.");
      return { ...post, url: postUrl(post.slug) };
    }

    case "create_post": {
      const a = schemas.create_post.parse(rawArgs);
      const status = a.status ?? "DRAFT";
      const slug = await uniqueSlug(slugify(a.slug || a.title));
      const created = await prisma.post.create({
        data: {
          title: a.title,
          slug,
          excerpt: a.excerpt ?? "",
          contentHtml: a.contentHtml,
          coverImage: a.coverImage || null,
          status,
          metaTitle: a.metaTitle || null,
          metaDescription: a.metaDescription || null,
          faq: JSON.stringify(a.faq ?? []),
          tags: JSON.stringify(cleanList(a.tags)),
          keywords: JSON.stringify(cleanList(a.keywords, true)),
          authorId: await defaultAuthorId(),
          publishedAt: status === "PUBLISHED" ? new Date() : null,
        },
        select: { id: true, slug: true, status: true },
      });
      await revalidatePost(created.slug, created.status === "PUBLISHED");
      return { ...created, url: postUrl(created.slug) };
    }

    case "update_post": {
      const { id, ...a } = schemas.update_post.parse(rawArgs);
      const existing = await prisma.post.findUnique({ where: { id } });
      if (!existing) throw new Error("Post not found.");

      const slug =
        a.slug !== undefined ? await uniqueSlug(slugify(a.slug || existing.title), id) : existing.slug;
      const status = a.status ?? existing.status;
      const updated = await prisma.post.update({
        where: { id },
        data: {
          ...(a.title !== undefined && { title: a.title }),
          slug,
          ...(a.excerpt !== undefined && { excerpt: a.excerpt }),
          ...(a.contentHtml !== undefined && { contentHtml: a.contentHtml }),
          ...(a.coverImage !== undefined && { coverImage: a.coverImage || null }),
          ...(a.metaTitle !== undefined && { metaTitle: a.metaTitle || null }),
          ...(a.metaDescription !== undefined && { metaDescription: a.metaDescription || null }),
          ...(a.faq !== undefined && { faq: JSON.stringify(a.faq) }),
          ...(a.tags !== undefined && { tags: JSON.stringify(cleanList(a.tags)) }),
          ...(a.keywords !== undefined && { keywords: JSON.stringify(cleanList(a.keywords, true)) }),
          status,
          publishedAt: status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : null,
        },
        select: { id: true, slug: true, status: true },
      });
      if (existing.slug !== updated.slug) revalidatePath(`/blog/${existing.slug}`);
      await revalidatePost(updated.slug, updated.status === "PUBLISHED");
      return { ...updated, url: postUrl(updated.slug) };
    }

    case "delete_post": {
      const a = schemas.delete_post.parse(rawArgs);
      const deleted = await prisma.post.delete({ where: { id: a.id }, select: { slug: true } });
      await revalidatePost(deleted.slug);
      return { deleted: true, id: a.id };
    }

    case "upload_image":
      return uploadImage(schemas.upload_image.parse(rawArgs ?? {}));
  }
}
