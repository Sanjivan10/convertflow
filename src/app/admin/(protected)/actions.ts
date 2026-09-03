"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { can, canEditPost, type Permission } from "@/lib/permissions";

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    throw new Error("You do not have permission to do that.");
  }
  return user;
}

const faqSchema = z
  .array(
    z.object({
      question: z.string().trim().min(1),
      answer: z.string().trim().min(1),
    }),
  )
  .default([]);

function parseFaq(raw: FormDataEntryValue | null) {
  if (!raw) return [];
  try {
    return faqSchema.parse(JSON.parse(String(raw)));
  } catch {
    return [];
  }
}

function parseKeywords(raw: FormDataEntryValue | null): string[] {
  if (!raw) return [];
  const str = String(raw);
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed))
      return parsed.map((k) => String(k).trim().toLowerCase()).filter(Boolean);
  } catch {
    /* fall through to comma parsing */
  }
  return str
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
}

/* ---------------------------------- Posts --------------------------------- */

const postSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z.string().trim().optional(),
  excerpt: z.string().trim().default(""),
  contentHtml: z.string().default(""),
  coverImage: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  metaTitle: z.string().trim().optional().or(z.literal("")),
  metaDescription: z.string().trim().optional().or(z.literal("")),
  tags: z.string().trim().default(""),
});

export async function savePost(formData: FormData) {
  const user = await requireUser();
  if (!can(user.role, "manage:ownBlogs") && !can(user.role, "manage:blogs")) {
    throw new Error("You do not have permission to manage posts.");
  }

  const parsed = postSchema.parse({
    title: formData.get("title"),
    slug: formData.get("slug") ?? undefined,
    excerpt: formData.get("excerpt") ?? "",
    contentHtml: formData.get("contentHtml") ?? "",
    coverImage: formData.get("coverImage") ?? "",
    status: formData.get("status") ?? "DRAFT",
    metaTitle: formData.get("metaTitle") ?? "",
    metaDescription: formData.get("metaDescription") ?? "",
    tags: formData.get("tags") ?? "",
  });

  const id = formData.get("id") ? String(formData.get("id")) : null;
  const slug = slugify(parsed.slug || parsed.title);
  const faq = parseFaq(formData.get("faq"));
  const keywords = parseKeywords(formData.get("keywords"));
  const tags = parsed.tags
    ? parsed.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  // Authors cannot publish; force draft unless they hold publish:blogs.
  let status = parsed.status;
  if (status === "PUBLISHED" && !can(user.role, "publish:blogs")) {
    status = "DRAFT";
  }
  const publish = status === "PUBLISHED";

  const data = {
    title: parsed.title,
    slug,
    excerpt: parsed.excerpt,
    contentHtml: parsed.contentHtml,
    coverImage: parsed.coverImage || null,
    status,
    metaTitle: parsed.metaTitle || null,
    metaDescription: parsed.metaDescription || null,
    faq: JSON.stringify(faq),
    tags: JSON.stringify(tags),
    keywords: JSON.stringify(keywords),
  };

  let savedId = id;
  if (id) {
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) throw new Error("Post not found.");
    if (!canEditPost(user.role, user.id, existing.authorId)) {
      throw new Error("You can only edit your own posts.");
    }
    await prisma.post.update({
      where: { id },
      data: {
        ...data,
        publishedAt:
          publish && !existing.publishedAt
            ? new Date()
            : publish
              ? existing.publishedAt
              : null,
      },
    });
  } else {
    const created = await prisma.post.create({
      data: {
        ...data,
        authorId: user.id,
        publishedAt: publish ? new Date() : null,
      },
    });
    savedId = created.id;
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blogs");
  redirect(`/admin/blogs/${savedId}?saved=1`);
}

export async function deletePost(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) redirect("/admin/blogs");
  if (!canEditPost(user.role, user.id, existing!.authorId)) {
    throw new Error("You can only delete your own posts.");
  }
  await prisma.post.delete({ where: { id } });
  revalidatePath("/blog");
  revalidatePath("/admin/blogs");
  revalidatePath("/sitemap.xml");
  redirect("/admin/blogs");
}

/* ---------------------------------- Tools --------------------------------- */

const toolSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z.string().trim().optional(),
  category: z.string().trim().default("image"),
  fromFormat: z.string().trim().min(1, "From format is required"),
  toFormat: z.string().trim().min(1, "To format is required"),
  description: z.string().trim().default(""),
  longDescription: z.string().default(""),
  accept: z.string().trim().default(""),
  engine: z.enum(["IMAGE", "PDF", "CUSTOM"]).default("IMAGE"),
  customScript: z.string().default(""),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  metaTitle: z.string().trim().optional().or(z.literal("")),
  metaDescription: z.string().trim().optional().or(z.literal("")),
  ogImage: z.string().trim().optional().or(z.literal("")),
  featured: z.union([z.literal("on"), z.null(), z.string()]).optional(),
});

export async function saveTool(formData: FormData) {
  await requirePermission("manage:tools");

  const parsed = toolSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? undefined,
    category: formData.get("category") ?? "image",
    fromFormat: formData.get("fromFormat"),
    toFormat: formData.get("toFormat"),
    description: formData.get("description") ?? "",
    longDescription: formData.get("longDescription") ?? "",
    accept: formData.get("accept") ?? "",
    engine: formData.get("engine") ?? "IMAGE",
    customScript: formData.get("customScript") ?? "",
    status: formData.get("status") ?? "DRAFT",
    metaTitle: formData.get("metaTitle") ?? "",
    metaDescription: formData.get("metaDescription") ?? "",
    ogImage: formData.get("ogImage") ?? "",
    featured: formData.get("featured"),
  });

  const id = formData.get("id") ? String(formData.get("id")) : null;
  const slug = slugify(parsed.slug || `${parsed.fromFormat}-to-${parsed.toFormat}`);
  const faq = parseFaq(formData.get("faq"));
  const keywords = parseKeywords(formData.get("keywords"));

  const data = {
    name: parsed.name,
    slug,
    category: parsed.category.toLowerCase(),
    fromFormat: parsed.fromFormat.toUpperCase(),
    toFormat: parsed.toFormat.toUpperCase(),
    description: parsed.description,
    longDescription: parsed.longDescription,
    accept: parsed.accept,
    engine: parsed.engine,
    customScript: parsed.engine === "CUSTOM" ? parsed.customScript : "",
    status: parsed.status,
    metaTitle: parsed.metaTitle || null,
    metaDescription: parsed.metaDescription || null,
    ogImage: parsed.ogImage || null,
    faq: JSON.stringify(faq),
    keywords: JSON.stringify(keywords),
    featured: parsed.featured === "on" || parsed.featured === "true",
  };

  let savedId = id;
  if (id) {
    await prisma.tool.update({ where: { id }, data });
  } else {
    const created = await prisma.tool.create({ data });
    savedId = created.id;
  }

  revalidatePath("/");
  revalidatePath("/tools");
  revalidatePath(`/convert/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/tool-builder");
  redirect(`/admin/tool-builder/${savedId}?saved=1`);
}

export async function deleteTool(formData: FormData) {
  await requirePermission("manage:tools");
  const id = String(formData.get("id"));
  await prisma.tool.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/tools");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/tool-builder");
  redirect("/admin/tool-builder");
}
