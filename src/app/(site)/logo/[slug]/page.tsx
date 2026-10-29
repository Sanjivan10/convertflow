import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LOGO_TOOLS, logoToolBySlug } from "@/lib/logos/catalog";
import { absoluteUrl } from "@/lib/site";
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
import { LogoStudio } from "@/components/logo/logo-studio";
import {
  HowToSteps,
  QuickAnswer,
  TrustBar,
  type HowToStep,
} from "@/components/tool/seo-blocks";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return LOGO_TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = logoToolBySlug(slug);
  if (!tool) return { title: "Logo not found" };
  return buildMetadata({
    title: tool.metaTitle,
    description: tool.metaDescription,
    path: `/logo/${tool.slug}`,
    keywords: tool.keywords,
    ogImage: absoluteUrl(tool.ogImage),
  });
}

const RELATED = [
  { href: "/convert/png-to-jpg", name: "PNG to JPG", hint: "Turn the logo into a JPG" },
  { href: "/convert/png-to-webp", name: "PNG to WebP", hint: "Smaller logo for websites" },
  { href: "/compress/png-compressor", name: "PNG Compressor", hint: "Shrink the PNG file size" },
];

export default async function LogoToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = logoToolBySlug(slug);
  if (!tool) notFound();

  const path = `/logo/${tool.slug}`;
  const fileBase = tool.slug.replace(/-png$/, "");
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Logos", path: "/tools?category=logo" },
    { name: tool.name, path },
  ];

  const steps: HowToStep[] = [
    {
      name: "Choose a version",
      text: `Pick the original ${tool.brand} logo, the white-text version for dark backgrounds, an all-white or all-black version, the icon, or the circle icon.`,
    },
    {
      name: "Set format, size and background",
      text: "Choose PNG, JPG, WebP or SVG, a width up to 6000 px, and a transparent, white, black or custom background. Add padding if you need space around the logo.",
    },
    {
      name: "Download",
      text: "Press Download. The file is created instantly in your browser — free, with no sign-up and no watermark.",
    },
  ];

  const imageSchemas = tool.variants.map((v) => ({
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: `${tool.brand} logo PNG – ${v.label}`,
    caption: `${tool.brand} logo, ${v.label.toLowerCase()}, transparent PNG`,
    contentUrl: absoluteUrl(`${v.file}.png`),
    encodingFormat: "image/png",
    width: v.pngWidth,
    height: v.pngHeight,
    creditText: tool.owner,
    copyrightNotice: `${tool.brand} is a trademark of ${tool.owner}`,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          softwareApplicationSchema({
            name: `${tool.name} Downloader`,
            description: tool.metaDescription,
            path,
            featureList: [
              "Transparent PNG",
              "HD up to 6000 px",
              "PNG, JPG, WebP and SVG",
              "White, black, icon and circle versions",
              "Custom background and padding",
              "Free — no sign-up, no watermark",
            ],
          }),
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          howToSchema({
            name: `How to download the ${tool.brand} logo PNG`,
            description: tool.metaDescription,
            path,
            steps,
          }),
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(speakableSchema(path, [".quick-answer", "h1"]))}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(breadcrumbSchema(crumbs))}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(faqPageSchema(tool.faq))}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(imageSchemas)}
      />

      <Breadcrumbs items={crumbs} />

      <header className="mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {tool.h1}
        </h1>
        <p className="mt-2 text-slate-500">{tool.description}</p>
      </header>

      <QuickAnswer>
        <strong>{tool.brand} logo PNG:</strong> choose a version below, keep the
        background on “Transparent” and press Download to get the{" "}
        {tool.brand} logo as a transparent HD PNG — up to 6000 px wide. White,
        black, icon and circle versions, SVG, JPG and WebP are included. Free, no
        sign-up, no watermark.
      </QuickAnswer>

      <TrustBar />

      <div className="mt-6">
        <LogoStudio
          slug={tool.slug}
          brand={tool.brand}
          fileBase={fileBase}
          variants={tool.variants}
          colors={tool.colors}
        />
      </div>

      <AdZone zone="tool-top" format="leaderboard" className="my-6" />

      <section className="py-4">
        <h2 className="text-2xl font-bold">
          {tool.brand} logo PNG – quick downloads
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Ready-made transparent PNG files. Tap a file type to download.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {tool.variants.map((v) => (
            <figure
              key={v.id}
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
            >
              <div
                className={
                  v.dark
                    ? "flex h-36 items-center justify-center bg-slate-900 p-4"
                    : "flex h-36 items-center justify-center bg-slate-50 p-4"
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${v.file}.png`}
                  alt={`${tool.brand} logo PNG transparent – ${v.label}`}
                  title={`${tool.brand} logo PNG – ${v.label}`}
                  width={v.pngWidth}
                  height={v.pngHeight}
                  loading="lazy"
                  decoding="async"
                  className="max-h-full w-auto max-w-full object-contain"
                />
              </div>
              <figcaption className="flex items-center justify-between gap-2 p-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {tool.brand} logo – {v.label}
                  </span>
                  <span className="text-xs text-slate-500">
                    {v.pngWidth} × {v.pngHeight}px
                  </span>
                </span>
                <span className="flex shrink-0 gap-1.5">
                  <a
                    href={`${v.file}.png`}
                    download
                    className="rounded-md bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-700"
                  >
                    PNG
                  </a>
                  <a
                    href={`${v.file}.svg`}
                    download
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-sky-400 dark:border-slate-700 dark:text-slate-200"
                  >
                    SVG
                  </a>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="py-4">
        <h2 className="text-2xl font-bold">About the {tool.brand} logo</h2>
        <div
          className="article mt-4 text-slate-600 dark:text-slate-300"
          dangerouslySetInnerHTML={{ __html: tool.longDescription }}
        />
      </section>

      <HowToSteps heading={`How to download the ${tool.brand} logo PNG`} steps={steps} />

      <FaqSection items={tool.faq} />

      <section className="py-6">
        <h2 className="text-2xl font-bold">Related tools</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {RELATED.map((r) => (
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

      <p className="mt-6 rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-500 dark:bg-slate-900">
        {tool.brand} and the {tool.brand} logo are trademarks of {tool.owner}.
        ConvertFlow is not affiliated with or endorsed by {tool.owner}. The logo
        is provided for identification and reference — for example in
        tutorials, reviews and credits. Visit the official site at{" "}
        <a
          href={tool.officialSite}
          rel="nofollow noopener"
          target="_blank"
          className="text-sky-600 hover:underline"
        >
          {tool.officialSite.replace(/^https?:\/\//, "")}
        </a>
        .
      </p>
    </div>
  );
}
