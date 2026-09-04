import Link from "next/link";
import {
  breadcrumbSchema,
  faqPageSchema,
  howToSchema,
  jsonLdScript,
  softwareApplicationSchema,
  speakableSchema,
  type Crumb,
} from "@/lib/seo";
import { PDF_TOOLS, type PdfToolDef } from "@/lib/pdf/catalog";
import { isConversionConfigured } from "@/lib/convert/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FaqSection } from "@/components/faq-section";
import { AdZone } from "@/components/ad-zone";
import { Badge } from "@/components/ui/badge";
import { PdfWorkspaceLoader } from "@/components/pdf/pdf-workspace-loader";
import {
  HowToSteps,
  QuickAnswer,
  TrustBar,
  type HowToStep,
} from "@/components/tool/seo-blocks";

const CAPABILITY_LABEL = {
  client: null,
  beta: "Beta — see limitations below",
  "server-api": null,
  server: "Preview — needs a server engine",
} as const;

export function PdfToolPage({ tool }: { tool: PdfToolDef }) {
  const conversionConfigured = isConversionConfigured();
  const capBadge =
    tool.capability === "server-api" && !conversionConfigured
      ? "Setup required"
      : CAPABILITY_LABEL[tool.capability];
  const path = `/${tool.routePrefix}/${tool.slug}`;
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools?category=pdf" },
    { name: tool.name, path },
  ];

  const related = PDF_TOOLS.filter(
    (t) => t.slug !== tool.slug && t.category === tool.category,
  ).slice(0, 3);

  const steps: HowToStep[] = [
    {
      name: "Add your file",
      text: `Drop your file onto the ${tool.name} workspace above, or click to browse for it.`,
    },
    {
      name: "Choose the options",
      text: `Adjust the settings for ${tool.name.toLowerCase()} — the defaults work for most files.`,
    },
    {
      name: "Download the result",
      text:
        tool.capability === "server-api"
          ? "The file is processed on the server and deleted straight after. Click Download to save it."
          : "The result is generated in your browser — nothing is uploaded. Click Download to save it.",
    },
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
            featureList: [tool.name, "Free — no sign-up", "No watermark", "Any browser"],
          }),
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          howToSchema({
            name: tool.h1,
            description: tool.metaDescription,
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
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {tool.h1}
          </h1>
          {capBadge && (
            <Badge
              variant={
                tool.capability === "server" || !conversionConfigured
                  ? "warning"
                  : "muted"
              }
            >
              {capBadge}
            </Badge>
          )}
        </div>
        <p className="mt-2 text-slate-500">{tool.description}</p>
      </header>

      <QuickAnswer>
        <strong>{tool.h1}:</strong> {tool.description} Add your file to the tool
        above, apply it, and download the result — free, in any browser, with no
        sign-up.
      </QuickAnswer>

      <TrustBar />

      <AdZone zone="tool-top" format="leaderboard" className="my-6" />

      <div className="mt-2">
        <PdfWorkspaceLoader
          slug={tool.slug}
          op={tool.op}
          name={tool.name}
          accept={tool.accept}
          multiple={tool.multiple}
          capability={tool.capability}
          conversionConfigured={conversionConfigured}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          {tool.longDescription && (
            <section className="py-4">
              <h2 className="text-2xl font-bold">About this tool</h2>
              <div
                className="article mt-4 text-slate-600 dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: tool.longDescription }}
              />
            </section>
          )}

          <HowToSteps heading={`How to use ${tool.name}`} steps={steps} />

          <FaqSection items={tool.faq} />
        </div>

        <aside className="hidden lg:block">
          <AdZone zone="tool-sidebar" format="sidebar" />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="py-6">
          <h2 className="text-2xl font-bold">Related PDF tools</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((t) => (
              <Link
                key={t.slug}
                href={`/${t.routePrefix}/${t.slug}`}
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
        Looking for something else?{" "}
        <Link href="/tools" className="text-sky-600 hover:underline">
          See all PDF tools
        </Link>
        .
      </p>
    </div>
  );
}
