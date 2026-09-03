import type { Metadata } from "next";
import { getPublishedTools } from "@/lib/tools";
import { PDF_TOOLS, PDF_TOOL_CATEGORIES } from "@/lib/pdf/catalog";
import { buildMetadata } from "@/lib/seo";
import { ToolSearch } from "@/components/tool-search";
import { AdZone } from "@/components/ad-zone";
import type { ToolCardData } from "@/components/tool-card";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "All File Converters & PDF Tools",
  description:
    "Browse every free tool on ConvertFlow — image converters and the full 27-tool PDF suite. All run privately in your browser.",
  path: "/tools",
});

const CATEGORY_LABELS: Record<string, string> = {
  image: "Image converters",
  ...Object.fromEntries(PDF_TOOL_CATEGORIES.map((c) => [c.id, c.label])),
};

export default async function ToolsPage({
  searchParams,
}: PageProps<"/tools">) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : "";
  const q = typeof sp.q === "string" ? sp.q : "";

  const imageTools = await getPublishedTools();
  const imageCards: ToolCardData[] = imageTools.map((t) => ({
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

  const all = [...imageCards, ...pdfCards];
  const filtered = category ? all.filter((t) => t.category === category) : all;
  const categories = [...new Set(all.map((t) => t.category))];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">
        {category ? `${CATEGORY_LABELS[category] ?? category} tools` : "All tools"}
      </h1>
      <p className="mt-2 text-slate-500">
        {all.length} free tools · every conversion runs on your device
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <CategoryChip active={!category} href="/tools" label="All" />
        {categories.map((c) => (
          <CategoryChip
            key={c}
            active={category === c}
            href={`/tools?category=${c}`}
            label={CATEGORY_LABELS[c] ?? c}
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
      className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
        active
          ? "bg-sky-600 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {label}
    </a>
  );
}
