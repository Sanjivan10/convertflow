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
import { LogoConverter } from "@/components/logo/logo-converter";
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
  if (!tool) return { title: "Logo tool not found" };
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
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Logos", path: "/tools?category=logo" },
    { name: tool.name, path },
  ];

  const steps: HowToStep[] = [
    {
      name: "Upload your logo",
      text: "Drop any logo onto the tool — PNG, JPG, WebP, SVG, GIF or BMP. It opens instantly in your browser and is never uploaded.",
    },
    {
      name: "Remove the background",
      text: "The background color is detected and removed automatically — including inside letters — with soft, halo-free edges. Tap the background to pick its color and adjust Strength if anything is left.",
    },
    {
      name: "Style it for motion videos",
      text: "Keep the original colors or make the logo white, black or any color, add a circle or rounded badge, and set the padding.",
    },
    {
      name: "Choose size and download",
      text: "Pick PNG or WebP for a transparent background (or JPG), choose a width up to 4K, and press Download. Import the PNG into Alight Motion with + → Image & Video.",
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
            name: tool.name,
            description: tool.metaDescription,
            path,
            featureList: [
              "Any logo to transparent PNG",
              "Automatic background removal, including inside letters",
              "Halo-free clean edges",
              "Recolor to white, black or any color",
              "Circle and rounded badge",
              "HD and 4K export as PNG, WebP or JPG",
              "Free, private — runs in the browser",
            ],
          }),
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          howToSchema({
            name: "How to turn any logo into a transparent motion logo PNG",
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
        <strong>Make a motion logo PNG in 4 steps:</strong> upload any logo,
        remove the background automatically, style it (white, black or a badge), then
        download a transparent HD PNG up to 4K. Import it into {tool.brand} with
        + → Image &amp; Video. Free, no sign-up, and your logo never leaves your
        device.
      </QuickAnswer>

      <TrustBar />

      <div className="mt-6">
        <LogoConverter slug={tool.slug} sampleUrl={tool.sampleUrl} />
      </div>

      <AdZone zone="tool-top" format="leaderboard" className="my-6" />

      <HowToSteps heading="How to make a transparent motion logo PNG" steps={steps} />

      <section className="py-4">
        <h2 className="text-2xl font-bold">About the Motion Logo PNG Maker</h2>
        <div
          className="article mt-4 text-slate-600 dark:text-slate-300"
          dangerouslySetInnerHTML={{ __html: tool.longDescription }}
        />
      </section>

      <section className="py-4" id="official-logo">
        <h2 className="text-2xl font-bold">Official {tool.brand} logo PNG</h2>
        <p className="mt-2 text-sm text-slate-500">
          Need the {tool.brand} logo itself? These transparent PNG and SVG files
          are rebuilt from the official vector logo. Tap a file type to download.
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
                    {v.hint} · {v.pngWidth} × {v.pngHeight}px
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

        <h3 className="mt-6 font-semibold">{tool.brand} logo colors</h3>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tool.colors.map((c) => (
            <li
              key={c.hex}
              className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 dark:border-slate-700"
            >
              <span
                className="size-8 shrink-0 rounded-md border border-black/10"
                style={{ background: c.hex }}
              />
              <span className="min-w-0">
                <span className="block font-mono text-sm font-semibold">{c.hex}</span>
                <span className="block truncate text-xs text-slate-500">{c.name}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

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
        ConvertFlow is not affiliated with or endorsed by {tool.owner}. The
        official logo files are provided for identification and reference — for
        example in tutorials, reviews and credits. Visit the official site at{" "}
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
