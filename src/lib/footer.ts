import "server-only";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";

export type FooterLink = { label: string; href: string };
export type FooterColumn = { title: string; links: FooterLink[] };

export type FooterConfig = {
  columns: FooterColumn[];
  tagline: string;
  bottomText: string;
  bgColor: string;
  textColor: string;
  headingColor: string;
  linkColor: string;
  columnsCount: number;
  align: "left" | "center";
};

export const DEFAULT_FOOTER: FooterConfig = {
  tagline: siteConfig.description,
  bottomText: `© {year} ${siteConfig.name}. All conversions run locally in your browser.`,
  bgColor: "#f8fafc",
  textColor: "#64748b",
  headingColor: "#334155",
  linkColor: "#0284c7",
  columnsCount: 4,
  align: "left",
  columns: [
    {
      title: "Convert",
      links: [
        { label: "All tools", href: "/tools" },
        { label: "PNG to JPG", href: "/convert/png-to-jpg" },
        { label: "JPG to PDF", href: "/tools/jpg-to-pdf" },
        { label: "PDF to Word", href: "/convert/pdf-to-word" },
      ],
    },
    {
      title: "PDF Tools",
      links: [
        { label: "Merge PDF", href: "/tools/merge-pdf" },
        { label: "Split PDF", href: "/tools/split-pdf" },
        { label: "Compress PDF", href: "/tools/compress-pdf" },
        { label: "Sign PDF", href: "/tools/sign-pdf" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Blog", href: "/blog" },
        { label: "Sitemap", href: "/sitemap.xml" },
      ],
    },
    {
      title: "Company",
      links: [{ label: "Admin", href: "/admin" }],
    },
  ],
};

export async function getFooterConfig(): Promise<FooterConfig> {
  try {
    const row = await prisma.footerConfig.findUnique({ where: { id: "site" } });
    if (!row) return DEFAULT_FOOTER;
    const data = JSON.parse(row.data || "{}") as Partial<FooterConfig>;
    return {
      columns: Array.isArray(data.columns) ? data.columns : DEFAULT_FOOTER.columns,
      tagline: data.tagline ?? DEFAULT_FOOTER.tagline,
      bottomText: data.bottomText ?? DEFAULT_FOOTER.bottomText,
      bgColor: row.bgColor,
      textColor: row.textColor,
      headingColor: row.headingColor,
      linkColor: row.linkColor,
      columnsCount: row.columnsCount,
      align: row.align === "center" ? "center" : "left",
    };
  } catch {
    return DEFAULT_FOOTER;
  }
}
