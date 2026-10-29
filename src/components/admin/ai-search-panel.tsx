import Link from "next/link";
import type { AiStats } from "@/lib/ai-analytics";

const card = "rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900";
const KIND_LABEL = { live: "answering a user", index: "search index", training: "model training" } as const;

/** Dashboard section: visits from AI assistants, pages they read, likely prompts. */
export function AiSearchPanel({ stats }: { stats: AiStats }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">
          AI search &amp; citations
          <span className="ml-1 text-sm font-normal text-slate-400">· {stats.days} days</span>
        </h2>
        <p className="text-sm text-slate-500">
          Visits sent by ChatGPT, Gemini, Claude, Perplexity, Grok and other assistants, and the pages they read
          while answering people.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9">
        <div className={`${card} xl:col-span-1`}>
          <p className="text-xs font-medium text-slate-500">AI visits</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{stats.totalVisits}</p>
          <p className="text-xs text-slate-400">{stats.liveFetches} live AI reads</p>
        </div>
        {stats.platforms.map((p) => (
          <div key={p.id} className={card}>
            <p className="text-xs font-medium text-slate-500">{p.name}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{p.visits}</p>
            <p className="text-xs text-slate-400">
              {p.liveFetches > 0 ? `${p.liveFetches} reads` : "visits"}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={card}>
          <h3 className="text-sm font-semibold text-slate-600">
            Likely AI prompts <span className="font-normal text-slate-400">· estimated</span>
          </h3>
          <ul className="mt-3 space-y-2.5 text-sm">
            {stats.prompts.length === 0 && (
              <li className="py-6 text-center text-slate-400">No AI traffic yet.</li>
            )}
            {stats.prompts.map((p) => (
              <li key={`${p.path}-${p.prompt}`}>
                <div className="flex justify-between gap-3">
                  <span className="min-w-0">“{p.prompt}”</span>
                  <span className="shrink-0 tabular-nums text-slate-500">{p.score}</span>
                </div>
                <p className="truncate text-xs text-slate-400">
                  {p.platforms.join(", ")} →{" "}
                  <Link href={p.path} className="text-sky-600 hover:underline">
                    {p.path}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className={card}>
          <h3 className="text-sm font-semibold text-slate-600">Pages AI sent visitors to</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {stats.landingPages.length === 0 && (
              <li className="py-6 text-center text-slate-400">No AI referrals yet.</li>
            )}
            {stats.landingPages.map((p) => (
              <li key={p.path}>
                <div className="flex justify-between gap-3">
                  <Link href={p.path} className="truncate text-sky-600 hover:underline">
                    {p.path}
                  </Link>
                  <span className="tabular-nums text-slate-500">{p.count}</span>
                </div>
                <p className="text-xs text-slate-400">{p.platforms.join(", ")}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className={card}>
          <h3 className="text-sm font-semibold text-slate-600">Pages AI read while answering (cited)</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {stats.fetchedPages.length === 0 && (
              <li className="py-6 text-center text-slate-400">No live AI reads yet.</li>
            )}
            {stats.fetchedPages.map((p) => (
              <li key={p.path}>
                <div className="flex justify-between gap-3">
                  <Link href={p.path} className="truncate text-sky-600 hover:underline">
                    {p.path}
                  </Link>
                  <span className="tabular-nums text-slate-500">{p.count}</span>
                </div>
                <p className="text-xs text-slate-400">{p.bots.join(", ")}</p>
              </li>
            ))}
          </ul>
          {stats.crawlers.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500">All AI bot visits</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-500">
                {stats.crawlers.map((c) => (
                  <li key={c.bot} className="flex justify-between gap-2">
                    <span>
                      {c.bot} <span className="text-slate-400">({KIND_LABEL[c.kind] ?? c.kind})</span>
                    </span>
                    <span className="tabular-nums">{c.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 dark:bg-slate-900">
        <strong>How to read this:</strong> AI assistants never share the exact prompt a person typed. “AI visits”
        and “Pages AI read” are real, measured events. “Likely AI prompts” are estimated from the pages each
        assistant sent people to or read. <strong>Google AI Overviews / AI Mode</strong> clicks arrive as normal
        Google traffic — see them in Search Console → Performance. Grok and Gemini don’t identify their page
        reads, so only their visits are counted.
      </p>
    </section>
  );
}
