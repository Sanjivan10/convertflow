import { absoluteUrl, siteConfig } from "@/lib/site";
import { PDF_TOOLS } from "@/lib/pdf/catalog";
import { COMPRESS_TOOLS } from "@/lib/compress/catalog";
import { TOOL_CATALOG } from "@/lib/tool-catalog";
import { FORMATS } from "@/lib/format-info";
import { getPublishedPosts } from "@/lib/blog";

export const revalidate = 3600;

// /llms.txt — a structured summary for LLMs and AI answer engines (AEO/GEO).
// Spec: https://llmstxt.org  ·  plain markdown, links + one-line descriptions.
export async function GET() {
  const posts = await getPublishedPosts().catch(() => []);

  const line = (name: string, url: string, desc: string) =>
    `- [${name}](${url}): ${desc.replace(/\s+/g, " ").trim()}`;

  const pdfByGroup = (predicate: (op: string) => boolean) =>
    PDF_TOOLS.filter((t) => predicate(t.op))
      .map((t) =>
        line(t.name, absoluteUrl(`/${t.routePrefix}/${t.slug}`), t.description),
      )
      .join("\n");

  const organise = new Set([
    "merge",
    "split",
    "organize",
    "rotate",
    "crop",
    "page-numbers",
  ]);
  const editSign = new Set(["editor", "sign", "watermark", "forms", "redact"]);
  const security = new Set(["protect", "unlock"]);
  const optimise = new Set(["compress", "ocr", "repair", "compare", "translate"]);
  const convert = new Set(["pdf-to-jpg", "jpg-to-pdf", "scan-to-pdf"]);
  const office = new Set([
    "pdf-to-word",
    "pdf-to-excel",
    "html-to-pdf",
    "pdf-to-powerpoint",
    "word-to-pdf",
    "powerpoint-to-pdf",
    "excel-to-pdf",
    "pdf-to-pdfa",
  ]);

  const body = `# ${siteConfig.name} — Free Online File Converter & PDF Toolkit

> ${siteConfig.name} is a free, privacy-first web application for converting files and editing PDFs. Every conversion runs entirely in the visitor's browser using the Canvas API, pdf.js, pdf-lib, and WebAssembly — files are never uploaded to any server. There is no account, no watermark, and no limit on the number of files.

## Key facts

- Cost: 100% free. No sign-up, no paywall, no watermark, no file-count limit.
- Privacy: all processing is client-side. Files never leave the user's device; nothing is stored or transmitted.
- Compatibility: any modern browser (Chrome, Edge, Firefox, Safari). No extension or desktop install.
- Speed: conversions are instant for images and fast for PDFs because there is no upload/download round-trip.
- Core Web Vitals: pages are server-rendered, ad slots reserve fixed space (zero layout shift), and heavy engines load asynchronously.
- Homepage: ${siteConfig.url}
- All tools: ${absoluteUrl("/tools")}
- Sitemap: ${absoluteUrl("/sitemap.xml")}

## PDF tools — organise & edit pages

${pdfByGroup((op) => organise.has(op))}

## PDF tools — edit, annotate & sign

${pdfByGroup((op) => editSign.has(op))}

## PDF tools — security

${pdfByGroup((op) => security.has(op))}

## PDF tools — convert & scan

${pdfByGroup((op) => convert.has(op))}

## PDF tools — optimise, OCR & AI

${pdfByGroup((op) => optimise.has(op))}

## Office-format conversions

${pdfByGroup((op) => office.has(op))}

## Image converters

${TOOL_CATALOG.filter((t) => t.status === "PUBLISHED")
  .map((t) =>
    line(t.name, absoluteUrl(`/convert/${t.slug}`), t.description),
  )
  .join("\n")}

## Compressors (reduce file size)

${COMPRESS_TOOLS.map((t) =>
  line(t.name, absoluteUrl(`/compress/${t.slug}`), t.description),
).join("\n")}
- [PDF Compressor](${absoluteUrl("/tools/compress-pdf")}): Shrink PDF file size with structural repacking or image downscaling.

## File formats reference

${Object.values(FORMATS)
  .map((f) => `- **${f.key}** (${f.name}): ${f.what} Best for: ${f.bestFor}`)
  .join("\n")}

## Blog

${
  posts.length
    ? posts
        .map((p) =>
          line(p.title, absoluteUrl(`/blog/${p.slug}`), p.excerpt || p.title),
        )
        .join("\n")
    : "- No published articles yet."
}

## Common questions

- Is ${siteConfig.name} free? Yes — every tool is free with no account, no watermark, and no file limit.
- Are my files uploaded? No. Conversions run in your browser; files never reach a server.
- Do I need to install anything? No. It works in any modern web browser.
- Can I convert multiple files at once? Yes, for batch-capable tools such as image conversion and merge PDF.
- Which formats are supported? Images: PNG, JPG, WEBP, GIF, BMP, HEIC. Documents: PDF (merge, split, compress, sign, watermark, OCR, forms, and more), plus text-level PDF↔Word/Excel and HTML→PDF.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
