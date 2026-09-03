import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pdfToolBySlug, pdfToolsByPrefix } from "@/lib/pdf/catalog";
import { buildMetadata } from "@/lib/seo";
import { PdfToolPage } from "@/components/pdf/pdf-tool-page";

export const dynamicParams = false;

export function generateStaticParams() {
  return pdfToolsByPrefix("tools").map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tool = pdfToolBySlug(slug);
  if (!tool || tool.routePrefix !== "tools") return { title: "Tool not found" };

  return buildMetadata({
    title: tool.metaTitle,
    description: tool.metaDescription,
    path: `/tools/${tool.slug}`,
    keywords: [tool.name, `${tool.name} online`, `free ${tool.name.toLowerCase()}`],
  });
}

export default async function ToolSlugPage({
  params,
}: PageProps<"/tools/[slug]">) {
  const { slug } = await params;
  const tool = pdfToolBySlug(slug);
  if (!tool || tool.routePrefix !== "tools") notFound();

  return <PdfToolPage tool={tool} />;
}
