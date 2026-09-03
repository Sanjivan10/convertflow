import type { FaqItem } from "@/lib/seo";

export function FaqSection({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;
  return (
    <section className="py-10">
      <h2 className="text-2xl font-bold">Frequently asked questions</h2>
      <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {items.map((item, i) => (
          <details key={i} className="group px-5 py-4">
            <summary className="cursor-pointer list-none font-medium text-slate-800 marker:hidden group-open:text-sky-700 dark:text-slate-100">
              {item.question}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
