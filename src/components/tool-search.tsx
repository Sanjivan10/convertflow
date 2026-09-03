"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ToolCard, type ToolCardData } from "@/components/tool-card";

export function ToolSearch({
  tools,
  initialQuery = "",
  autoFocus = false,
}: {
  tools: ToolCardData[];
  initialQuery?: string;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((t) =>
      `${t.name} ${t.slug} ${t.fromFormat} ${t.toFormat} ${t.category} ${t.description}`
        .toLowerCase()
        .includes(q),
    );
  }, [query, tools]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 100+ converters — try “png to jpg” or “pdf”"
          className="h-14 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-4 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      <p className="mt-3 text-sm text-slate-400">
        {results.length} tool{results.length === 1 ? "" : "s"}
        {query.trim() ? ` matching “${query.trim()}”` : ""}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>

      {results.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          No converter matches that yet. An admin can add it from the tool
          builder.
        </p>
      )}
    </div>
  );
}
