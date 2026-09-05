import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { Breadcrumbs } from "@/components/breadcrumbs";
import type { Crumb } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: `How ${siteConfig.name} handles your files and data — what runs in your browser, what touches a server, and what analytics and ads we use.`,
  path: "/privacy",
});

const UPDATED = "September 5, 2026";

export default function PrivacyPage() {
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Privacy Policy", path: "/privacy" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {UPDATED}</p>

      <div className="article mt-8">
        <p>
          {siteConfig.name} ("we", "our") is a file-conversion and PDF-tools
          website. This page explains, plainly, what happens to your files
          and what data we collect when you use the site.
        </p>

        <h2>Most tools process your files entirely in your browser</h2>
        <p>
          The majority of our tools — image conversion, image compression,
          merging/splitting/compressing PDFs, PDF organizing, redacting,
          form-filling, e-signatures, and OCR — run using your browser's own
          processing power (Canvas API, WebAssembly, pdf.js, pdf-lib,
          tesseract.js). Your file is never uploaded to our server for these
          tools; it's read, processed, and the result is handed back to you,
          all on your own device.
        </p>

        <h2>Some conversions are processed on a server — here's which ones</h2>
        <p>
          A small number of tools require a real office-document engine that
          can't run in a browser. Specifically: <strong>Word to PDF, PowerPoint
          to PDF, Excel to PDF, PDF to PowerPoint,</strong> and{" "}
          <strong>PDF to PDF/A</strong>. For these tools only, your file is sent
          over an encrypted connection to a third-party document-conversion
          provider, converted, and the result is returned to you. We do not
          keep a copy — the file is not stored on our servers, and the
          conversion provider processes it transiently to perform the
          conversion. If a tool sends your file to a server, it does not
          claim otherwise on that tool's page.
        </p>

        <h2>Analytics we collect</h2>
        <p>
          We collect first-party, aggregate analytics: which pages are
          visited, which tool conversions are run, search queries typed into
          our search box, button clicks, and an approximate country derived
          from your IP address (we do not store the IP address itself). This
          data is not tied to your name, email, or any personal identifier —
          we don't require an account to use the site's tools — and is used
          only to understand which tools and content are useful, so we can
          improve them.
        </p>

        <h2>Cookies</h2>
        <ul>
          <li>
            <strong>Language switcher:</strong> if you choose a language from
            the footer, a <code>googtrans</code> cookie remembers your choice
            (this triggers Google Translate to machine-translate the page).
          </li>
          <li>
            <strong>Advertising:</strong> if advertising is enabled on this
            site, Google AdSense and its partners may set cookies to serve
            and measure ads, including personalized ads based on your
            visits to this and other sites. You can control ad
            personalization at{" "}
            <a
              href="https://adssettings.google.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              adssettings.google.com
            </a>
            , and see how Google uses this data at{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
            >
              policies.google.com/technologies/partner-sites
            </a>
            .
          </li>
        </ul>

        <h2>Third parties</h2>
        <p>
          Where a server-side conversion is used (see above), we use a
          third-party conversion API solely to perform that conversion. We
          may also use standard web infrastructure providers (hosting,
          database, and content-delivery) to run the site itself. None of
          these parties are permitted to use your files for anything other
          than delivering the service to you.
        </p>

        <h2>Children's privacy</h2>
        <p>
          This site is not directed at children under 13, and we do not
          knowingly collect personal information from children.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If this policy changes, we'll update the date at the top of this
          page. Continued use of the site after a change means you accept
          the updated policy.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Reach out via our{" "}
          <a href="/contact">Contact page</a>.
        </p>
      </div>
    </div>
  );
}
