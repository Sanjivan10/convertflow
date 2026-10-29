import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { Breadcrumbs } from "@/components/breadcrumbs";
import type { Crumb } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description: `Who runs ${siteConfig.name} and why: free, private, browser-based file converters, PDF tools and logo maker — no account, no watermark, no limits.`,
  path: "/about",
});

export default function AboutPage() {
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">
        About {siteConfig.name}
      </h1>

      <div className="article mt-8">
        <p>
          {siteConfig.name} started from a simple frustration: converting a
          file or editing a PDF online usually means uploading it to a
          stranger's server, creating an account, and hoping a watermark
          doesn't show up on the result. Most of the time, none of that is
          actually necessary — a modern browser can already do the work
          itself.
        </p>

        <h2>What we build</h2>
        <p>
          {siteConfig.name} is a set of file-conversion and PDF tools:
          image format conversion, image and video compression, and a full
          PDF toolkit — merge, split, compress, organize, sign, redact, fill
          forms, and OCR. Most of these run entirely in your browser using
          the Canvas API, WebAssembly, and libraries like pdf.js and
          pdf-lib, so your file is processed on your own device rather than
          uploaded anywhere. A handful of document conversions (Word,
          PowerPoint, and Excel to/from PDF, and PDF/A) need a real office
          engine that can't run in a browser, so those go through a
          conversion API — that's disclosed clearly on our{" "}
          <a href="/privacy">Privacy Policy</a> and on the tool itself.
        </p>

        <h2>Who is behind {siteConfig.name}</h2>
        <p>
          {siteConfig.name} is an independent project built and maintained by
          Sanjivan Dhakal (Idea2Grow). Every tool is tested on real files —
          phones and desktops — before it goes live, and we fix bugs reported
          by visitors quickly. You can follow updates on{" "}
          <a href="https://x.com/DhakalSanjivan" target="_blank" rel="me noopener">
            X (@DhakalSanjivan)
          </a>
          .
        </p>

        <h2>Our principles</h2>
        <ul>
          <li><strong>Private by default</strong> — if a tool can run in your browser, it does. Files that never leave your device can’t leak.</li>
          <li><strong>Honest about servers</strong> — the few tools that need a server say so clearly. See <Link href="/how-it-works">How it works</Link>.</li>
          <li><strong>No catches</strong> — no account, no watermark, no file-count limit, no paywall.</li>
          <li><strong>Fast on any device</strong> — pages are built to load quickly even on slow mobile connections.</li>
        </ul>

        <h2>What you can do here</h2>
        <ul>
          <li><Link href="/tools?category=image">Convert images</Link> between PNG, JPG, WebP, GIF, HEIC and more.</li>
          <li><Link href="/tools?category=pdf">Work with PDFs</Link> — merge, split, compress, sign, fill forms, OCR and convert Office files.</li>
          <li><Link href="/tools?category=compress">Compress files</Link> to share or upload them faster.</li>
          <li><Link href="/tools?category=logo">Make logo PNGs</Link> with transparent backgrounds for videos and designs.</li>
          <li>Read step-by-step guides on our <Link href="/blog">blog</Link>.</li>
        </ul>

        <h2>How we keep it free</h2>
        <p>
          There's no subscription and no account required to use the tools.
          The site is supported by advertising, which helps cover hosting
          and development costs without charging visitors or limiting how
          many files you can convert.
        </p>

        <h2>Get in touch</h2>
        <p>
          Questions, feedback, or found something broken? Visit our{" "}
          <a href="/contact">Contact page</a>.
        </p>
      </div>
    </div>
  );
}
