import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COMPRESS_TOOLS, compressToolBySlug } from "@/lib/compress/catalog";
import { isConversionConfigured } from "@/lib/convert/server";
import {
  breadcrumbSchema,
  buildMetadata,
  faqPageSchema,
  jsonLdScript,
  softwareApplicationSchema,
  type Crumb,
} from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FaqSection } from "@/components/faq-section";
import { AdZone } from "@/components/ad-zone";
import { Badge } from "@/components/ui/badge";
import { CompressWorkspaceLoader } from "@/components/compress/compress-workspace-loader";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return COMPRESS_TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = compressToolBySlug(slug);
  if (!tool) return { title: "Compressor not found" };
  return buildMetadata({
    title: tool.metaTitle,
    description: tool.metaDescription,
    path: `/compress/${tool.slug}`,
    keywords: [
      tool.name.toLowerCase(),
      `${tool.name.toLowerCase()} online`,
      `free ${tool.name.toLowerCase()}`,
      "reduce file size",
      "compress file online",
    ],
  });
}

export default async function CompressToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = compressToolBySlug(slug);
  if (!tool) notFound();

  const configured = isConversionConfigured();
  const path = `/compress/${tool.slug}`;
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Compress", path: "/tools?category=compress" },
    { name: tool.name, path },
  ];
  const related = COMPRESS_TOOLS.filter(
    (t) => t.slug !== tool.slug && t.category === tool.category,
  ).slice(0, 3);

  const needsSetup = tool.engine === "server" && !configured;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          softwareApplicationSchema({
            name: tool.name,
            description: tool.metaDescription,
            path,
          }),
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
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {tool.h1}
          </h1>
          {needsSetup && <Badge variant="warning">Setup required</Badge>}
        </div>
        <p className="mt-2 text-slate-500">{tool.description}</p>
      </header>

      <AdZone zone="tool-top" format="leaderboard" className="my-6" />

      <div className="mt-2">
        <CompressWorkspaceLoader
          slug={tool.slug}
          engine={tool.engine}
          serverOp={tool.serverOp}
          name={tool.name}
          accept={tool.accept}
          conversionConfigured={configured}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <section className="py-4">
            <h2 className="text-2xl font-bold">About {tool.name.toLowerCase()}</h2>
            <div
              className="article mt-4 text-slate-600 dark:text-slate-300"
              dangerouslySetInnerHTML={{ __html: tool.longDescription }}
            />
          </section>

          <section className="py-4">
            <h2 className="text-2xl font-bold">How it works</h2>
            <ol className="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
              <li>
                <h3 className="inline font-semibold">1. Add your file(s).</h3>{" "}
                Drop them onto the box above.
              </li>
              <li>
                <h3 className="inline font-semibold">2. Set the quality.</h3>{" "}
                Lower quality = smaller file. Preview the output size before
                downloading.
              </li>
              <li>
                <h3 className="inline font-semibold">3. Download.</h3>{" "}
                {tool.engine === "image"
                  ? "The compressed file is created in your browser — nothing is uploaded."
                  : "The file is compressed on the server and then deleted."}
              </li>
            </ol>
          </section>

          <FaqSection items={tool.faq} />
        </div>

        <aside className="hidden lg:block">
          <AdZone zone="tool-sidebar" format="sidebar" />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="py-6">
          <h2 className="text-2xl font-bold">Related compressors</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((t) => (
              <Link
                key={t.slug}
                href={`/compress/${t.slug}`}
                className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-sky-300 dark:border-slate-800"
              >
                <p className="font-semibold hover:text-sky-700">{t.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {t.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <AdZone zone="tool-footer" format="rectangle" className="my-6" />

      <p className="text-center text-sm text-slate-400">
        Also try{" "}
        <Link href="/tools/compress-pdf" className="text-sky-600 hover:underline">
          PDF Compressor
        </Link>{" "}
        ·{" "}
        <Link href="/tools" className="text-sky-600 hover:underline">
          all tools
        </Link>
      </p>
    </div>
  );
}
