import Link from "next/link";
import { getFooterConfig } from "@/lib/footer";
import { LanguageSwitcher } from "@/components/language-switcher";

export async function SiteFooter() {
  const cfg = await getFooterConfig();
  const shownColumns = cfg.columns.slice(0, cfg.columnsCount);

  return (
    <footer
      className="mt-auto border-t"
      style={{
        background: cfg.bgColor,
        color: cfg.textColor,
        borderColor: `${cfg.textColor}22`,
      }}
    >
      <div
        className="mx-auto grid max-w-6xl gap-8 px-4 py-12"
        style={{
          gridTemplateColumns: `repeat(1, minmax(0,1fr))`,
          textAlign: cfg.align,
        }}
      >
        <div className="sm:col-span-2 lg:col-span-4">
          <div
            className="grid gap-8 sm:grid-cols-2"
            style={{
              gridTemplateColumns: undefined,
            }}
          >
            <div>
              <p className="font-bold" style={{ color: cfg.headingColor }}>
                ConvertFlow
              </p>
              <p className="mt-2 max-w-xs text-sm">{cfg.tagline}</p>
            </div>
            <div
              className="grid gap-8"
              style={{
                gridTemplateColumns: `repeat(${Math.max(
                  1,
                  shownColumns.length,
                )}, minmax(0,1fr))`,
              }}
            >
              {shownColumns.map((col) => (
                <div key={col.title}>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: cfg.headingColor }}
                  >
                    {col.title}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {col.links.map((link) => (
                      <li key={`${col.title}-${link.href}-${link.label}`}>
                        <Link
                          href={link.href}
                          className="transition-opacity hover:opacity-70"
                          style={{ color: cfg.linkColor }}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div
        className="flex flex-col items-center justify-between gap-3 border-t px-4 py-6 text-center text-xs sm:flex-row"
        style={{ borderColor: `${cfg.textColor}22` }}
      >
        <span>
          {cfg.bottomText.replace("{year}", String(new Date().getFullYear()))}
        </span>
        <LanguageSwitcher labelColor={cfg.textColor} />
      </div>
    </footer>
  );
}
