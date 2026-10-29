import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MEDIA_TOOLS,
  mediaTool,
  mediaToolPath,
  type MediaSection,
  type MediaToolDef,
} from "@/lib/media-tools/catalog";
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
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FaqSection } from "@/components/faq-section";
import { AdZone } from "@/components/ad-zone";
import { HowToSteps, QuickAnswer, TrustBar } from "@/components/tool/seo-blocks";
import { VideoCutter } from "@/components/video/video-cutter";
import { BackgroundRemover } from "@/components/image/background-remover";

/** Shared page for /video/[slug] and /image/[slug] tools. */

const SECTION_LABEL: Record<MediaSection, { name: string; href: string }> = {
  video: { name: "Video", href: "/tools?category=video" },
  image: { name: "Image", href: "/tools?category=image" },
};

export function mediaStaticParams(section: MediaSection) {
  return MEDIA_TOOLS.filter((t) => t.section === section).map((t) => ({ slug: t.slug }));
}

export function mediaMetadata(section: MediaSection, slug: string): Metadata {
  const tool = mediaTool(section, slug);
  if (!tool) return { title: "Tool not found" };
  return buildMetadata({
    title: tool.metaTitle,
    description: tool.metaDescription,
    path: mediaToolPath(tool),
    keywords: tool.keywords,
  });
}

function Widget({ tool }: { tool: MediaToolDef }) {
  switch (tool.widget) {
    case "video-cutter":
      return <VideoCutter slug={tool.slug} />;
    case "background-remover":
      return <BackgroundRemover slug={tool.slug} />;
  }
}

export function MediaToolPage({ section, slug }: { section: MediaSection; slug: string }) {
  const tool = mediaTool(section, slug);
  if (!tool) notFound();

  const path = mediaToolPath(tool);
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: SECTION_LABEL[section].name, path: SECTION_LABEL[section].href },
    { name: tool.name, path },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          softwareApplicationSchema({
            name: tool.name,
            description: tool.metaDescription,
            path,
            featureList: tool.featureList,
          }),
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          howToSchema({ name: `How to use the ${tool.name}`, description: tool.metaDescription, path, steps: tool.steps }),
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(speakableSchema(path, [".quick-answer", "h1"]))}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumbSchema(crumbs))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(faqPageSchema(tool.faq))} />

      <Breadcrumbs items={crumbs} />

      <header className="mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{tool.h1}</h1>
        <p className="mt-2 text-slate-500">{tool.description}</p>
      </header>

      <QuickAnswer>
        <strong>{tool.name}:</strong> {tool.quickAnswer}
      </QuickAnswer>

      <TrustBar />

      <div className="mt-6">
        <Widget tool={tool} />
      </div>

      <AdZone zone="tool-top" format="leaderboard" className="my-6" />

      <HowToSteps heading={`How to use the ${tool.name}, step by step`} steps={tool.steps} />

      <section className="py-4">
        <h2 className="text-2xl font-bold">About the {tool.name}</h2>
        <div
          className="article mt-4 text-slate-600 dark:text-slate-300"
          dangerouslySetInnerHTML={{ __html: tool.longDescription }}
        />
      </section>

      <FaqSection items={tool.faq} />

      <section className="py-6">
        <h2 className="text-2xl font-bold">Related tools</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {tool.related.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-sky-300 dark:border-slate-800"
            >
              <p className="font-semibold hover:text-sky-700">{r.name}</p>
              <p className="mt-1 text-xs text-slate-500">{r.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      <AdZone zone="tool-footer" format="rectangle" className="my-6" />
    </div>
  );
}
