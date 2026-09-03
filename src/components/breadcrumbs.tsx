import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Crumb } from "@/lib/seo";

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-slate-500">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5 text-slate-300" />}
              {last ? (
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className="hover:text-sky-600">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
