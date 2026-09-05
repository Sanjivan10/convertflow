import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { Breadcrumbs } from "@/components/breadcrumbs";
import type { Crumb } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description: `Why ${siteConfig.name} exists: free, private, browser-based file conversion and PDF tools — no account, no watermark.`,
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
