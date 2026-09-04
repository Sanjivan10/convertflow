import { CheckCircle2, ShieldCheck, Zap, Infinity as InfinityIcon } from "lucide-react";
import { formatInfo } from "@/lib/format-info";

/**
 * Server-rendered content blocks that give every tool page the depth and
 * structure search engines and AI answer engines reward: a short quotable
 * answer, a trust bar, format explainers, and numbered how-to steps.
 * No client JavaScript.
 */

/** The 2–3 sentence answer AI Overviews / ChatGPT / Perplexity tend to quote. */
export function QuickAnswer({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-speakable="quick-answer"
      className="quick-answer mt-4 rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-[15px] leading-relaxed text-slate-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-slate-200"
    >
      {children}
    </div>
  );
}

const TRUST = [
  { icon: CheckCircle2, label: "100% free — no sign-up" },
  { icon: ShieldCheck, label: "Files processed privately" },
  { icon: Zap, label: "Fast — no upload wait" },
  { icon: InfinityIcon, label: "No file-count limit" },
];

export function TrustBar() {
  return (
    <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-500 sm:flex sm:flex-wrap sm:gap-x-5 dark:text-slate-400">
      {TRUST.map((t) => (
        <li key={t.label} className="inline-flex items-center gap-1.5">
          <t.icon className="size-3.5 text-emerald-500" />
          {t.label}
        </li>
      ))}
    </ul>
  );
}

/** "What is X?" / "X vs Y" explainer, only rendered when we have real data. */
export function FormatExplainer({ from, to }: { from?: string; to?: string }) {
  const f = from ? formatInfo(from) : undefined;
  const t = to ? formatInfo(to) : undefined;
  if (!f && !t) return null;

  return (
    <section className="py-4">
      <h2 className="text-2xl font-bold">
        {f && t ? `${f.key} vs ${t.key}: what changes` : `About the ${(f ?? t)!.key} format`}
      </h2>
      <div className="mt-4 space-y-4 text-slate-600 dark:text-slate-300">
        {f && (
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">
              What is {f.name}?
            </h3>
            <p className="mt-1">{f.what}</p>
            <p className="mt-1 text-sm">
              <span className="font-medium">Best for:</span> {f.bestFor}{" "}
              <span className="font-medium">Trade-offs:</span> {f.limits}
            </p>
          </div>
        )}
        {t && t.key !== f?.key && (
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">
              What is {t.name}?
            </h3>
            <p className="mt-1">{t.what}</p>
            <p className="mt-1 text-sm">
              <span className="font-medium">Best for:</span> {t.bestFor}{" "}
              <span className="font-medium">Trade-offs:</span> {t.limits}
            </p>
          </div>
        )}
        {f && t && f.key !== t.key && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                  <th className="py-2 pr-4 font-medium">Property</th>
                  <th className="py-2 pr-4 font-medium">{f.key}</th>
                  <th className="py-2 font-medium">{t.key}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-2 pr-4">Compression</td>
                  <td className="py-2 pr-4">{f.lossy ? "Lossy" : "Lossless"}</td>
                  <td className="py-2">{t.lossy ? "Lossy" : "Lossless"}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Transparency</td>
                  <td className="py-2 pr-4">{f.alpha ? "Yes" : "No"}</td>
                  <td className="py-2">{t.alpha ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Typical use</td>
                  <td className="py-2 pr-4">{f.bestFor.split(",")[0]}</td>
                  <td className="py-2">{t.bestFor.split(",")[0]}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export type HowToStep = { name: string; text: string };

export function HowToSteps({
  heading,
  steps,
}: {
  heading: string;
  steps: HowToStep[];
}) {
  return (
    <section className="py-4">
      <h2 className="text-2xl font-bold">{heading}</h2>
      <ol className="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
        {steps.map((s, i) => (
          <li key={i} id={`step-${i + 1}`}>
            <h3 className="inline font-semibold text-slate-800 dark:text-slate-100">
              {i + 1}. {s.name}
            </h3>{" "}
            {s.text}
          </li>
        ))}
      </ol>
    </section>
  );
}
