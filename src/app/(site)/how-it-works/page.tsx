import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, breadcrumbSchema, faqPageSchema, jsonLdScript, type Crumb, type FaqItem } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FaqSection } from "@/components/faq-section";

export const metadata: Metadata = buildMetadata({
  title: "How Our Tools Work",
  description: `How ${siteConfig.name}'s free converters, PDF tools and logo maker work: most run privately in your browser, a few use a secure server. Step by step.`,
  path: "/how-it-works",
});

const ROWS: { tools: string; where: string; tech: string }[] = [
  { tools: "Image converters (PNG, JPG, WebP, GIF, BMP, HEIC…)", where: "Your browser", tech: "Canvas API, WebAssembly decoders" },
  { tools: "Image compressors (JPEG, PNG, WebP)", where: "Your browser", tech: "Canvas API with adjustable quality" },
  { tools: "Motion Logo PNG Maker", where: "Your browser", tech: "Canvas pixel processing (background removal, recolor, resize)" },
  { tools: "PDF merge, split, organize, compress, sign, redact, fill forms", where: "Your browser", tech: "pdf-lib and pdf.js" },
  { tools: "PDF OCR (make scanned PDFs searchable)", where: "Your browser", tech: "tesseract.js (WebAssembly OCR)" },
  { tools: "Word, PowerPoint, Excel ↔ PDF and PDF/A", where: "Secure server", tech: "Office-document engine; file deleted after conversion" },
  { tools: "GIF, video and audio compression", where: "Secure server", tech: "Media encoder; file deleted after processing" },
];

const FAQ: FaqItem[] = [
  {
    question: "How can a website convert files without uploading them?",
    answer:
      "Modern browsers can run powerful code such as the Canvas API and WebAssembly. Our tools send that code to your browser, and your browser does the conversion on your own device. The file never travels to our server.",
  },
  {
    question: "How do I know if a tool uses a server?",
    answer:
      "Every tool that sends your file to a server says so on its page, and they are listed in the table above. All other tools run fully in your browser.",
  },
  {
    question: "Why are the tools free?",
    answer:
      "The site shows ads, which pay for hosting and development. There is no paid plan, no account, no watermark and no limit on the number of files.",
  },
  {
    question: "Is there a file size limit?",
    answer:
      "Browser tools are limited only by your device's memory — very large files (hundreds of MB) may be slow on phones. Server-based tools may have a lower size limit because the file has to be transferred.",
  },
  {
    question: "Will the converted file look exactly like the original?",
    answer:
      "Lossless conversions (for example PNG to PNG, PDF merging) keep full quality. Lossy formats like JPG and WebP use a quality setting you control. Converting complex Office documents can shift some layout, so always check the result.",
  },
];

export default function HowItWorksPage() {
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "How it works", path: "/how-it-works" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumbSchema(crumbs))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(faqPageSchema(FAQ))} />
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">How {siteConfig.name} works</h1>
      <p className="mt-2 text-slate-500">
        Free file converters, PDF tools and a logo maker that work privately — most of them without ever uploading your file.
      </p>

      <div className="article mt-8">
        <h2>Using any tool, step by step</h2>
        <ol>
          <li>
            <strong>Open a tool.</strong> Pick one from <Link href="/tools">All tools</Link> or search on the homepage.
          </li>
          <li>
            <strong>Add your file.</strong> Drag it onto the box or tap to choose it. Nothing is uploaded at this point —
            the file is opened by your browser.
          </li>
          <li>
            <strong>Choose your options.</strong> For example output format, quality, page order, size or background.
            A preview or the expected file size is shown where it helps.
          </li>
          <li>
            <strong>Convert and download.</strong> The result is created and saved straight to your device. Close the
            tab and nothing remains anywhere.
          </li>
        </ol>

        <h2>What runs in your browser vs. on a server</h2>
        <p>
          We process files in your browser whenever it’s technically possible, because a file that is never uploaded
          can’t leak. Only conversions that need a full office or media engine use a server.
        </p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            <tr>
              <th className="p-3 font-semibold">Tools</th>
              <th className="p-3 font-semibold">Where your file is processed</th>
              <th className="p-3 font-semibold">How</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {ROWS.map((r) => (
              <tr key={r.tools}>
                <td className="p-3">{r.tools}</td>
                <td className={`p-3 font-medium ${r.where === "Your browser" ? "text-emerald-600" : "text-amber-600"}`}>
                  {r.where}
                </td>
                <td className="p-3 text-slate-500">{r.tech}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="article mt-8">
        <h2>What happens to files sent to a server</h2>
        <p>
          For the few server-based tools, your file travels over an encrypted HTTPS connection to a conversion
          provider, is converted, and the result is returned to you. We don’t keep a copy and the provider only
          processes it to perform the conversion. Details are in our <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2>Quality and limits</h2>
        <ul>
          <li>Lossless operations (merging PDFs, PNG output) keep full quality.</li>
          <li>JPG and WebP output use a quality setting you control — lower means smaller files.</li>
          <li>Very large files can be slow on older phones, because your own device does the work.</li>
          <li>Complex Word, Excel or PowerPoint layouts may shift slightly when converted to PDF — always check the result.</li>
          <li>OCR accuracy depends on scan quality; clear, straight scans work best.</li>
        </ul>

        <h2>Who runs {siteConfig.name} and how it stays free</h2>
        <p>
          {siteConfig.name} is an independent project. There’s no subscription or account — the site is supported by
          ads shown around the tools, never inside your files and never disguised as download buttons. Read more on
          our <Link href="/about">About page</Link>, or <Link href="/contact">contact us</Link> with questions or bug
          reports.
        </p>
      </div>

      <FaqSection items={FAQ} />
    </div>
  );
}
