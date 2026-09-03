import Link from "next/link";
import { ArrowRight, Lock, Zap, Gauge } from "lucide-react";
import { getPublishedTools } from "@/lib/tools";
import { PDF_TOOLS } from "@/lib/pdf/catalog";
import { ToolSearch } from "@/components/tool-search";
import { AdZone } from "@/components/ad-zone";
import type { ToolCardData } from "@/components/tool-card";

export const revalidate = 300;

export default async function HomePage() {
  const tools = await getPublishedTools();
  const imageCards: ToolCardData[] = tools.map((t) => ({
    slug: t.slug,
    name: t.name,
    fromFormat: t.fromFormat,
    toFormat: t.toFormat,
    description: t.description,
    category: t.category,
  }));
  const pdfCards: ToolCardData[] = PDF_TOOLS.map((t) => ({
    slug: t.slug,
    name: t.name,
    fromFormat: t.op === "html-to-pdf" ? "HTML" : "PDF",
    toFormat: t.name.split(" to ")[1] ?? "PDF",
    description: t.description,
    category: t.category,
    href: `/${t.routePrefix}/${t.slug}`,
  }));
  const allCards = [...imageCards, ...pdfCards];
  const featuredPdf = PDF_TOOLS.filter((t) => t.featured);

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-14 text-center sm:py-20">
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Convert files & edit PDFs right in your browser
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
          A full PDF toolkit plus image converters — merge, split, sign,
          compress, and more. No uploads, no watermarks, no sign-up.
        </p>

        <div className="mx-auto mt-8 max-w-2xl">
          <ToolSearch tools={allCards} />
        </div>

        <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="size-4 text-emerald-500" /> 100% private
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="size-4 text-amber-500" /> Instant, offline-capable
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="size-4 text-sky-500" /> Zero layout shift
          </span>
        </div>
      </section>

      <AdZone zone="home-top" format="leaderboard" className="my-4" />

      <section className="py-10">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">PDF Tools</h2>
          <Link
            href="/tools?category=organize"
            className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:underline"
          >
            Browse all PDF tools <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredPdf.map((tool) => (
            <ToolLink
              key={tool.slug}
              href={`/${tool.routePrefix}/${tool.slug}`}
              name={tool.name}
              hint={tool.description}
            />
          ))}
        </div>
      </section>

      <section className="py-10">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Image converters</h2>
          <Link
            href="/tools"
            className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:underline"
          >
            Browse all <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {imageCards.slice(0, 9).map((tool) => (
            <ToolLink
              key={tool.slug}
              href={`/convert/${tool.slug}`}
              name={tool.name}
              hint={`${tool.fromFormat} → ${tool.toFormat}`}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 py-12 sm:grid-cols-3">
        <Feature
          title="Private by design"
          body="Conversions use the Canvas API, pdf.js, and pdf-lib in your browser. Files never leave your device — there is no server to upload to."
        />
        <Feature
          title="Built for Core Web Vitals"
          body="Every ad slot reserves fixed space, heavy PDF/OCR engines load asynchronously, and pages are server-rendered for a fast first paint."
        />
        <Feature
          title="Extensible"
          body="Admins add new converter routes from the tool builder — custom logic, metadata, and schema included — without a deploy."
        />
      </section>
    </div>
  );
}

function ToolLink({ href, name, hint }: { href: string; name: string; hint: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-sky-300 dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="min-w-0">
        <p className="truncate font-semibold group-hover:text-sky-700">{name}</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">{hint}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-500" />
    </Link>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-6 dark:border-slate-800">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{body}</p>
    </div>
  );
}
