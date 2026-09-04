/**
 * File-format knowledge base. Feeds the "What is X?", "X vs Y", and
 * quick-answer sections that make each tool page long, unique, and citable
 * by search engines and AI answer engines (the core ranking lever the big
 * converter sites use).
 *
 * Every fact here should be verifiable and neutral in tone.
 */

export type FormatInfo = {
  /** canonical key, uppercase, no dot (e.g. "PNG", "DOCX") */
  key: string;
  /** human name */
  name: string;
  /** category for grouping */
  kind: "image" | "document" | "spreadsheet" | "presentation" | "pdf" | "audio" | "video" | "markup";
  /** 1–2 sentence definition with a concrete spec — designed to be quoted */
  what: string;
  /** where it shines */
  bestFor: string;
  /** honest downsides */
  limits: string;
  /** true if lossy compression */
  lossy?: boolean;
  /** true if it supports transparency */
  alpha?: boolean;
};

export const FORMATS: Record<string, FormatInfo> = {
  PNG: {
    key: "PNG",
    name: "PNG (Portable Network Graphics)",
    kind: "image",
    what: "PNG is a lossless raster image format that supports up to 16.7 million colours plus a full 8-bit alpha channel for transparency. It uses DEFLATE compression, so re-saving a PNG never degrades quality.",
    bestFor: "Logos, icons, screenshots, line art, and any image that needs sharp edges or a transparent background.",
    limits: "Files are much larger than JPG or WebP for photographs, and PNG cannot store animation.",
    alpha: true,
  },
  JPG: {
    key: "JPG",
    name: "JPG / JPEG (Joint Photographic Experts Group)",
    kind: "image",
    what: "JPG is a lossy raster format that compresses photographic images by discarding detail the human eye is unlikely to notice. Quality is set on a 0–100 scale; most web images use 60–85.",
    bestFor: "Photographs and complex images with smooth colour gradients, where small file size matters more than pixel-perfect accuracy.",
    limits: "No transparency, visible artefacts at low quality, and every re-save loses a little more detail (generation loss).",
    lossy: true,
  },
  JPEG: {
    key: "JPEG",
    name: "JPEG",
    kind: "image",
    what: "JPEG is the same format as JPG — the two extensions are interchangeable. It is a lossy format that compresses photos by removing fine detail, with a 0–100 quality control.",
    bestFor: "Photos and camera images where a small file size is the priority.",
    limits: "No transparency and cumulative quality loss on repeated saves.",
    lossy: true,
  },
  WEBP: {
    key: "WEBP",
    name: "WebP",
    kind: "image",
    what: "WebP is a modern image format from Google that offers both lossy and lossless modes plus alpha transparency and animation. At matched quality it is typically 25–35% smaller than JPG or PNG.",
    bestFor: "Web images where page-load speed and Core Web Vitals matter; it replaces both JPG and PNG in one format.",
    limits: "Older software and some social platforms still do not accept WebP, so a JPG or PNG copy is sometimes needed.",
    lossy: true,
    alpha: true,
  },
  GIF: {
    key: "GIF",
    name: "GIF (Graphics Interchange Format)",
    kind: "image",
    what: "GIF is a raster format limited to a 256-colour palette per frame, with support for simple animation and 1-bit (on/off) transparency. It uses lossless LZW compression.",
    bestFor: "Short looping animations and simple graphics with few colours.",
    limits: "Only 256 colours (poor for photos), 1-bit transparency with hard edges, and large file sizes compared with video or WebP.",
    alpha: true,
  },
  HEIC: {
    key: "HEIC",
    name: "HEIC / HEIF",
    kind: "image",
    what: "HEIC is the container Apple devices use for photos, storing HEVC-compressed images at roughly half the size of a JPG at the same quality. It supports 16-bit colour, transparency, and image sequences.",
    bestFor: "Storing iPhone/iPad photos efficiently on Apple devices.",
    limits: "Limited support on Windows, Android, and the web — HEIC usually has to be converted to JPG or PNG before sharing.",
    lossy: true,
  },
  BMP: {
    key: "BMP",
    name: "BMP (Bitmap)",
    kind: "image",
    what: "BMP is an uncompressed (or lightly compressed) raster format from early Windows. Each pixel is stored directly, so files are large but never lose quality.",
    bestFor: "Simple, legacy Windows workflows where compatibility beats file size.",
    limits: "Very large files, no real transparency support, and no metadata — almost always converted to PNG or JPG for modern use.",
  },
  SVG: {
    key: "SVG",
    name: "SVG (Scalable Vector Graphics)",
    kind: "image",
    what: "SVG is an XML-based vector format: shapes are described mathematically, so the image stays razor-sharp at any size and the file is usually tiny.",
    bestFor: "Logos, icons, and illustrations that must scale cleanly across screen sizes.",
    limits: "Not suitable for photographs, and complex SVGs can be slow to render or expose XSS risk if untrusted.",
  },
  PDF: {
    key: "PDF",
    name: "PDF (Portable Document Format)",
    kind: "pdf",
    what: "PDF is an ISO-standardised page-description format that fixes the exact layout of text, fonts, vector graphics, and images so a document looks identical on any device or printer.",
    bestFor: "Final documents, contracts, forms, invoices, and anything that must print or display consistently everywhere.",
    limits: "Hard to edit after export, and text can be locked inside scanned images unless OCR is applied.",
  },
  PDFA: {
    key: "PDFA",
    name: "PDF/A",
    kind: "pdf",
    what: "PDF/A is a restricted subset of PDF defined by ISO 19005 for long-term archiving. All fonts are embedded, colour is device-independent, and features that could break in future (JavaScript, external links, encryption) are forbidden.",
    bestFor: "Legal, government, and records-retention archives that must remain readable for decades.",
    limits: "Larger files because everything is embedded, and some interactive features are stripped out.",
  },
  DOC: {
    key: "DOC",
    name: "DOC (Microsoft Word 97–2003)",
    kind: "document",
    what: "DOC is the legacy binary format used by Microsoft Word before 2007. It stores text, formatting, images, and macros in a proprietary compound-file structure.",
    bestFor: "Opening older documents created in early versions of Word.",
    limits: "Proprietary and fragile — Microsoft itself recommends saving as DOCX or PDF today.",
  },
  DOCX: {
    key: "DOCX",
    name: "DOCX (Office Open XML)",
    kind: "document",
    what: "DOCX is the modern Word format: a ZIP archive of XML files (Office Open XML, ISO/IEC 29500) describing text, styles, tables, and images. It is smaller and more robust than the old DOC format.",
    bestFor: "Editable word-processing documents shared between Word, Google Docs, and LibreOffice.",
    limits: "Layout can shift slightly between apps; for a fixed, print-exact copy you export to PDF.",
  },
  XLS: {
    key: "XLS",
    name: "XLS (Microsoft Excel 97–2003)",
    kind: "spreadsheet",
    what: "XLS is the legacy binary Excel workbook format, capped at 65,536 rows and 256 columns per sheet.",
    bestFor: "Opening spreadsheets from older Excel versions.",
    limits: "Row/column limits and a proprietary structure — superseded by XLSX.",
  },
  XLSX: {
    key: "XLSX",
    name: "XLSX (Office Open XML Spreadsheet)",
    kind: "spreadsheet",
    what: "XLSX is the modern Excel format — a ZIP of XML parts supporting over a million rows per sheet, formulas, charts, and pivot tables.",
    bestFor: "Working spreadsheets with live formulas and data.",
    limits: "Not print-exact; export to PDF when the page layout must be fixed.",
  },
  PPT: {
    key: "PPT",
    name: "PPT (Microsoft PowerPoint 97–2003)",
    kind: "presentation",
    what: "PPT is the legacy binary PowerPoint format storing slides, layouts, media, and animations in a proprietary structure.",
    bestFor: "Opening decks built in older PowerPoint versions.",
    limits: "Proprietary and large — replaced by PPTX.",
  },
  PPTX: {
    key: "PPTX",
    name: "PPTX (Office Open XML Presentation)",
    kind: "presentation",
    what: "PPTX is the modern PowerPoint format: a ZIP of XML describing each slide, its shapes, text, transitions, and embedded media.",
    bestFor: "Editable slide decks shared across PowerPoint, Google Slides, and Keynote.",
    limits: "Fonts and animations can vary by app; export to PDF for a portable, non-editable handout.",
  },
  HTML: {
    key: "HTML",
    name: "HTML (HyperText Markup Language)",
    kind: "markup",
    what: "HTML is the markup language of the web — a tree of tags that a browser renders into a page, styled with CSS and made interactive with JavaScript.",
    bestFor: "Web pages, emails, and any content meant to be viewed in a browser.",
    limits: "Rendering depends on the browser and available fonts; export to PDF to freeze a page for print or sharing.",
  },
  MP4: {
    key: "MP4",
    name: "MP4 (MPEG-4 Part 14)",
    kind: "video",
    what: "MP4 is the most widely supported video container, normally holding H.264 or H.265 video with AAC audio. It streams well and plays on virtually every device.",
    bestFor: "Sharing and publishing video anywhere — web, mobile, social, messaging.",
    limits: "Compression is lossy; heavy re-encoding at low bitrate shows blocking and blur.",
    lossy: true,
  },
  MP3: {
    key: "MP3",
    name: "MP3 (MPEG-1 Audio Layer III)",
    kind: "audio",
    what: "MP3 is a lossy audio format that discards frequencies the ear is least sensitive to. A 128–320 kbps MP3 is a fraction of the size of the original recording.",
    bestFor: "Music and spoken-word audio where small files and universal playback matter.",
    limits: "Audible artefacts at low bitrate and no lossless option — use WAV or FLAC to keep full fidelity.",
    lossy: true,
  },
  WAV: {
    key: "WAV",
    name: "WAV (Waveform Audio)",
    kind: "audio",
    what: "WAV stores uncompressed PCM audio — an exact digital copy of the sound wave. A stereo 44.1 kHz/16-bit WAV is about 10 MB per minute.",
    bestFor: "Recording, editing, and mastering where every sample must be preserved.",
    limits: "Very large files and no metadata standard — convert to MP3 or AAC for distribution.",
  },
};

export function formatInfo(key: string): FormatInfo | undefined {
  return FORMATS[key.toUpperCase().replace(/[^A-Z]/g, "")];
}

/** One-sentence "why convert" hook, used in the quick-answer box. */
export function conversionRationale(from: string, to: string): string {
  const f = formatInfo(from);
  const t = formatInfo(to);
  if (!f || !t) {
    return `Converting ${from} to ${to} lets you use the file in software and workflows that expect the ${to} format.`;
  }
  if (f.lossy && !t.lossy)
    return `Converting ${f.key} to ${t.key} moves your image into a lossless format, so it can be edited and re-saved without further quality loss.`;
  if (!f.lossy && t.lossy)
    return `Converting ${f.key} to ${t.key} trades a little visual accuracy for a much smaller file — useful for web pages, email, and sharing.`;
  if (t.key === "PDF")
    return `Converting ${f.key} to PDF locks the layout so the document looks and prints the same on every device, with no editing app required.`;
  if (f.key === "PDF")
    return `Converting PDF to ${t.key} turns a fixed document back into an editable ${t.kind} you can change in ${t.name.split(" ")[0]} or a compatible app.`;
  return `Converting ${f.key} to ${t.key} makes the file compatible with tools and platforms that require ${t.key}.`;
}
