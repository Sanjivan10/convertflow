import Link from "next/link";
import { FileStack } from "lucide-react";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <FileStack className="size-6 text-sky-600" />
          <span className="text-lg tracking-tight">{siteConfig.name}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
