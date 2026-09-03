export const siteConfig = {
  name: "ConvertFlow",
  shortName: "ConvertFlow",
  description:
    "Free online file converter. Convert images, PDFs, and documents right in your browser — fast, private, and with no upload required.",
  // Set NEXT_PUBLIC_SITE_URL to the production domain before deploying.
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  locale: "en_US",
  twitter: "@convertflow",
  publisher: "ConvertFlow",
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "",
  nav: [
    { title: "All Tools", href: "/tools" },
    { title: "PDF", href: "/tools?category=pdf" },
    { title: "Compress", href: "/tools?category=compress" },
    { title: "Image", href: "/tools?category=image" },
    { title: "Blog", href: "/blog" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;

export function absoluteUrl(path = ""): string {
  const base = siteConfig.url.replace(/\/$/, "");
  if (!path) return base;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}
