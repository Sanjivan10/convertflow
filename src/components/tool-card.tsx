"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trackClick } from "@/lib/track";

export type ToolCardData = {
  slug: string;
  name: string;
  fromFormat: string;
  toFormat: string;
  description: string;
  category: string;
  /** Defaults to /convert/[slug] — pass to override (e.g. /tools/[slug]). */
  href?: string;
};

export function ToolCard({
  tool,
  source,
}: {
  tool: ToolCardData;
  /** Where the card is shown — recorded with the click event. */
  source?: string;
}) {
  const href = tool.href ?? `/convert/${tool.slug}`;
  return (
    <Link
      href={href}
      onClick={() =>
        trackClick(`tool:${tool.slug}`, { from: source ?? "grid", href })
      }
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:hover:border-sky-800"
    >
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {tool.fromFormat}
        </span>
        <ArrowRight className="size-3.5 text-slate-400" />
        <span className="rounded-md bg-sky-100 px-2 py-1 text-xs font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
          {tool.toFormat}
        </span>
        <Badge variant="muted" className="ml-auto capitalize">
          {tool.category}
        </Badge>
      </div>
      <p className="mt-3 font-semibold text-slate-900 group-hover:text-sky-700 dark:text-slate-100">
        {tool.name}
      </p>
      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
        {tool.description}
      </p>
    </Link>
  );
}
