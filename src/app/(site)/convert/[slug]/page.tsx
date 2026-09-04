import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedToolSlugs, getPublishedTools, getToolBySlug } from "@/lib/tools";
import { pdfToolBySlug, pdfToolsByPrefix } from "@/lib/pdf/catalog";
import { PdfToolPage } from "@/components/pdf/pdf-tool-page";
import {
  breadcrumbSchema,
  buildMetadata,
  faqPageSchema,
  howToSchema,
  jsonLdScript,
  softwareApplicationSchema,
  speakableSchema,
  type Crumb,
} from "@/lib/seo";
import { conversionRationale, formatInfo } from "@/lib/format-info";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FaqSection } from "@/components/faq-section";
import { AdZone } from "@/components/ad-zone";
import { Converter } from "@/components/converter/converter";
import { ToolCard } from "@/components/tool-card";
import {
  FormatExplainer,
  HowToSteps,
  QuickAnswer,
  TrustBar,
  type HowToStep,
} from "@/components/tool/seo-blocks";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPublishedToolSlugs();
  const officeSlugs = pdfToolsByPrefix("convert").map((t) => t.slug);
  return [...new Set([...slugs, ...officeSlugs])].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/convert/[slug]">): Promise<Metadata> {
  const { slug } = await params;

  const officeTool = pdfToolBySlug(slug);
  if (officeTool && officeTool.routePrefix === "convert") {
    return buildMetadata({
      title: officeTool.metaTitle,
      description: officeTool.metaDescription,
      path: `/convert/${officeTool.slug}`,
      keywords: [officeTool.name, `${officeTool.name} online`],
    });
  }

  const tool = await getToolBySlug(slug);
  if (!tool) return { title: "Converter not found" };

  return buildMetadata({
    title: tool.metaTitle ?? `${tool.name} — Free & Private`,
    description: tool.metaDescription ?? tool.description,
    path: `/convert/${tool.slug}`,
    ogImage: tool.ogImage ?? undefined,
    keywords: [
      ...tool.keywords,
      `${tool.fromFormat} to ${tool.toFormat}`,
      `convert ${tool.fromFormat} to ${tool.toFormat}`,
      `${tool.fromFormat} ${tool.toFormat} converter`,
      "free online converter",
    ],
  });
}

export default async function ConvertToolPage({
  params,
}: PageProps<"/convert/[slug]">) {
  const { slug } = await params;

  const officeTool = pdfToolBySlug(slug);
  if (officeTool && officeTool.routePrefix === "convert") {
    return <PdfToolPage tool={officeTool} />;
  }

  const tool = await getToolBySlug(slug);
  if (!tool || tool.status !== "PUBLISHED") notFound();

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: tool.name, path: `/convert/${tool.slug}` },
  ];

  const related = (await getPublishedTools())
    .filter((t) => t.slug !== tool.slug && t.category === tool.category)
    .slice(0, 3);

  const from = tool.fromFormat;
  const to = tool.toFormat;
  const path = `/convert/${tool.slug}`;
  const steps: HowToStep[] = [
    {
      name: `Add your ${from} file${tool.engine === "IMAGE" ? "(s)" : ""}`,
      text: `Drag a ${from} file onto the box above, or click to browse. You can add several at once.`,
    },
    {
      name: `Convert to ${to}`,
      text: `Press "Convert to ${to}". The file is processed right in your browser — nothing is uploaded to a server.`,
    },
    {
      name: `Download the ${to}`,
      text: `Save each ${to} result individually, or use "Download all" to get them in one go.`,
    },
  ];
  const featureList = [
    `${from} to ${to} conversion`,
    "Batch processing",
    "In-browser — no upload",
    "No watermark, no sign-up",
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          softwareApplicationSchema({
            name: tool.name,
            description: tool.metaDescription ?? tool.description,
            path,
            featureList,
          }),
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          howToSchema({
            name: `How to convert ${from} to ${to}`,
            description: `Convert ${from} files to ${to} online for free in three steps.`,
            path,
            steps,
          }),
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          speakableSchema(path, [".quick-answer", "h1"]),
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(breadcrumbSchema(crumbs))}
      />
      {tool.faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(faqPageSchema(tool.faq))}
        />
      )}

      <Breadcrumbs items={crumbs} />

      <header className="mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {from} to {to} Converter
        </h1>
        <p className="mt-2 text-slate-500">{tool.description}</p>
      </header>

      <QuickAnswer>
        <strong>
          To convert {from} to {to}:
        </strong>{" "}
        add your {from} file to the tool above, click{" "}
        <em>Convert to {to}</em>, and download the result. It is free, works in
        any browser, and the file never leaves your device.{" "}
        {conversionRationale(from, to)}
      </QuickAnswer>

      <TrustBar />

      <div className="mt-6">
        <Converter
          slug={tool.slug}
          name={tool.name}
          fromFormat={from}
          toFormat={to}
          engine={tool.engine}
          accept={tool.accept}
          customScript={tool.customScript}
        />
      </div>

      <AdZone zone="tool-bottom" format="leaderboard" className="my-8" />

      {tool.longDescription && (
        <section className="py-4">
          <h2 className="text-2xl font-bold">About this tool</h2>
          <div
            className="article mt-4 text-slate-600 dark:text-slate-300"
            dangerouslySetInnerHTML={{ __html: tool.longDescription }}
          />
        </section>
      )}

      <HowToSteps heading={`How to convert ${from} to ${to}`} steps={steps} />

      {(formatInfo(from) || formatInfo(to)) && (
        <FormatExplainer from={from} to={to} />
      )}

      <FaqSection items={tool.faq} />

      {related.length > 0 && (
        <section className="py-6">
          <h2 className="text-2xl font-bold">Related converters</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((t) => (
              <ToolCard
                key={t.slug}
                tool={{
                  slug: t.slug,
                  name: t.name,
                  fromFormat: t.fromFormat,
                  toFormat: t.toFormat,
                  description: t.description,
                  category: t.category,
                }}
              />
            ))}
          </div>
        </section>
      )}

      <AdZone zone="tool-footer" format="rectangle" className="my-6" />

      <p className="text-center text-sm text-slate-400">
        Looking for something else?{" "}
        <Link href="/tools" className="text-sky-600 hover:underline">
          See all converters
        </Link>
        .
      </p>
    </div>
  );
}
