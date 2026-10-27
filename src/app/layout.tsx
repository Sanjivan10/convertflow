import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/site";
import { AdsenseLoader } from "@/components/adsense-loader";
import {
  jsonLdScript,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  // Only used in a few code-style spots; don't compete with the main font.
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Free Online File Converter`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  // iPhone "Add to Home Screen" opens full-screen like an app.
  appleWebApp: { capable: true, title: siteConfig.shortName, statusBarStyle: "default" },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: siteConfig.url,
  },
  twitter: { card: "summary_large_image", creator: siteConfig.twitter },
  // Google Search Console ownership check.
  verification: { google: "x8JmNBAcsSoZndmX5A8m5i4XGGN_IuxDXdPgw0yLtB8" },
  // AdSense site verification. The AdSense script itself loads lazily
  // (see AdsenseLoader), so this meta tag is what Google's crawler reads.
  ...(siteConfig.adsenseClient && {
    other: { "google-adsense-account": siteConfig.adsenseClient },
  }),
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const adsenseClient = siteConfig.adsenseClient;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(organizationSchema())}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(websiteSchema())}
        />
        {adsenseClient ? <AdsenseLoader client={adsenseClient} /> : null}
      </body>
    </html>
  );
}
