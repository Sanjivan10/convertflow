import type { Metadata } from "next";
import { getPublishedTools } from "@/lib/tools";
import { PDF_TOOLS, PDF_TOOL_CATEGORIES } from "@/lib/pdf/catalog";
import {
  breadcrumbSchema,
  buildMetadata,
  jsonLdScript,
  type Crumb,
} from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ToolSearch } from "@/components/tool-search";
import { AdZone } from "@/components/ad-zone";
import type { ToolCardData } from "@/components/tool-card";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "All File Converters & PDF Tools",
  description:
    "Browse every free tool on ConvertFlow — image converters and the full PDF suite. All run privately in your browser.",
  path: "/tools",
});

// Query param -> human label for the H1 and breadcrumb.
const LABELS: Record<string, string> = {
  image: "Image converters",
  pdf: "PDF tools",
  ...Object.fromEntries(PDF_TOOL_CATEGORIES.map((c) => [c.id, c.label])),
};

type Card = ToolCardData & { group: "image" | "pdf" };

export default async function ToolsPage({
  searchParams,
}: PageProps<"/tools">) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : "";
  const q = typeof sp.q === "string" ? sp.q : "";

  const imageTools = await getPublishedTools();
  const imageCards: Card[] = imageTools.map((t) => ({
    slug: t.slug,
    name: t.name,
    fromFormat: t.fromFormat,
    toFormat: t.toFormat,
    description: t.description,
    category: t.category,
    group: "image",
  }));

  const pdfCards: Card[] = PDF_TOOLS.map((t) => {
    const to = t.name.match(/ to (\w+)/i);
    return {
      slug: t.slug,
      name: t.name,
      fromFormat: t.op === "html-to-pdf" ? "HTML" : "PDF",
      toFormat: to ? to[1].toUpperCase() : "PDF",
      description: t.description,
      category: t.category,
      href: `/${t.routePrefix}/${t.slug}`,
      group: "pdf" as const,
    };
  });

  const all: Card[] = [...imageCards, ...pdfCards];

  const filtered = !category
    ? all
    : category === "image"
      ? all.filter((c) => c.group === "image")
      : category === "pdf"
        ? all.filter((c) => c.group === "pdf")
        : all.filter((c) => c.group === "pdf" && c.category === category);

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    ...(category
      ? [
          {
            name: LABELS[category] ?? category,
            path: `/tools?category=${category}`,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(breadcrumbSchema(crumbs))}
      />

      <Breadcrumbs items={crumbs} />

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
        {category ? `${LABELS[category] ?? category}` : "All tools"}
      </h1>
      <p className="mt-2 text-slate-500">
        {filtered.length} of {all.length} free tools · every conversion runs on
        your device
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <CategoryChip active={!category} href="/tools" label="All" />
        <CategoryChip
          active={category === "image"}
          href="/tools?category=image"
          label="Image converters"
        />
        <CategoryChip
          active={category === "pdf"}
          href="/tools?category=pdf"
          label="PDF tools"
        />
        {PDF_TOOL_CATEGORIES.map((c) => (
          <CategoryChip
            key={c.id}
            active={category === c.id}
            href={`/tools?category=${c.id}`}
            label={c.label}
          />
        ))}
      </div>

      <div className="mt-8">
        <ToolSearch tools={filtered} initialQuery={q} />
      </div>

      <AdZone zone="tools-top" format="leaderboard" className="mt-10" />
    </div>
  );
}

function CategoryChip({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-sky-600 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {label}
    </a>
  );
}
