import type { FaqItem } from "@/lib/seo";

/** Which processing path a tool uses. */
export type ToolCapability =
  | "client" // runs fully in the browser
  | "beta" // runs in the browser with documented limitations
  | "server"; // needs a server engine / API key not configured in this build

export type PdfOp =
  | "merge"
  | "split"
  | "organize"
  | "rotate"
  | "crop"
  | "page-numbers"
  | "pdf-to-jpg"
  | "jpg-to-pdf"
  | "scan-to-pdf"
  | "watermark"
  | "compress"
  | "repair"
  | "unlock"
  | "protect"
  | "forms"
  | "sign"
  | "redact"
  | "editor"
  | "compare"
  | "ocr"
  | "pdf-to-word"
  | "pdf-to-excel"
  | "html-to-pdf"
  | "pdf-to-powerpoint"
  | "word-to-pdf"
  | "powerpoint-to-pdf"
  | "excel-to-pdf"
  | "pdf-to-pdfa"
  | "translate";

export type PdfToolDef = {
  slug: string;
  /** URL prefix: /tools/<slug> or /convert/<slug>. */
  routePrefix: "tools" | "convert";
  op: PdfOp;
  category: string;
  name: string;
  h1: string;
  description: string;
  longDescription: string;
  accept: string;
  multiple: boolean;
  capability: ToolCapability;
  faq: FaqItem[];
  metaTitle: string;
  metaDescription: string;
  featured?: boolean;
};

const PDF_ACCEPT = "application/pdf,.pdf";
const IMG_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
const BRAND = "ConvertFlow";

function baseFaq(name: string, extra: FaqItem[] = []): FaqItem[] {
  return [
    ...extra,
    {
      question: `Is ${name} free to use?`,
      answer: `Yes. ${name} is completely free with no watermark, no account, and no file-count limit.`,
    },
    {
      question: "Are my files uploaded to a server?",
      answer:
        "No. Processing happens in your browser using WebAssembly and the Canvas API. Your documents never leave your device.",
    },
    {
      question: "Which browsers are supported?",
      answer:
        "Any modern browser — Chrome, Edge, Firefox, or Safari. No extension or desktop app is required.",
    },
  ];
}

function tool(
  def: Omit<PdfToolDef, "metaTitle" | "metaDescription" | "faq" | "multiple"> &
    Partial<Pick<PdfToolDef, "metaTitle" | "metaDescription" | "faq" | "multiple">>,
): PdfToolDef {
  return {
    multiple: def.multiple ?? true,
    metaTitle:
      def.metaTitle ?? `${def.name} — Free Online Tool | ${BRAND}`,
    metaDescription:
      def.metaDescription ??
      `${def.description} 100% free, private, and browser-based — no upload, no watermark, no sign-up.`,
    faq: def.faq ?? baseFaq(def.name),
    ...def,
  };
}

export const PDF_TOOLS: PdfToolDef[] = [
  /* ---------------------- Page management & organisation --------------------- */
  tool({
    slug: "merge-pdf",
    routePrefix: "tools",
    op: "merge",
    category: "organize",
    name: "Merge PDF",
    h1: "Merge PDF files",
    description: "Combine multiple PDF files into one, in any order.",
    longDescription:
      "<p>Add two or more PDFs, drag the files into the order you want, and download a single combined document. Pages are copied byte-for-byte with <code>pdf-lib</code> — no re-compression, no quality loss.</p>",
    accept: PDF_ACCEPT,
    capability: "client",
    featured: true,
  }),
  tool({
    slug: "split-pdf",
    routePrefix: "tools",
    op: "split",
    category: "organize",
    name: "Split PDF",
    h1: "Split a PDF",
    description:
      "Extract page ranges or split every page into its own PDF file.",
    longDescription:
      "<p>Choose a mode: pull out a custom range such as <code>1-3, 8, 11-13</code>, or burst the document so each page becomes a standalone PDF. Everything runs locally.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "client",
    featured: true,
  }),
  tool({
    slug: "organize-pdf",
    routePrefix: "tools",
    op: "organize",
    category: "organize",
    name: "Organize PDF",
    h1: "Organize PDF pages",
    description:
      "Reorder, rotate, and delete pages on an interactive thumbnail grid.",
    longDescription:
      "<p>Every page is rendered as a draggable thumbnail. Drag to reorder, click to rotate in 90° steps, or mark pages for deletion, then export the rebuilt PDF.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "client",
    featured: true,
  }),
  tool({
    slug: "rotate-pdf",
    routePrefix: "tools",
    op: "rotate",
    category: "organize",
    name: "Rotate PDF",
    h1: "Rotate PDF pages",
    description: "Rotate all pages or selected pages by 90°, 180°, or 270°.",
    longDescription:
      "<p>Apply a rotation to the whole document or type a page selection. The rotation is written to each page's <code>/Rotate</code> entry, so it is lossless and reversible.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "client",
  }),
  tool({
    slug: "crop-pdf",
    routePrefix: "tools",
    op: "crop",
    category: "organize",
    name: "Crop PDF",
    h1: "Crop PDF margins",
    description: "Trim white margins from one page or the whole document.",
    longDescription:
      "<p>Set margins to remove from each edge (in millimetres) and preview the crop box on the first page. The tool adjusts every page's <code>CropBox</code> — the underlying content is preserved, just clipped.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "client",
  }),
  tool({
    slug: "page-numbers",
    routePrefix: "tools",
    op: "page-numbers",
    category: "organize",
    name: "Add Page Numbers",
    h1: "Add page numbers to a PDF",
    description:
      "Stamp page numbers with configurable position, margin, font size, and starting index.",
    longDescription:
      "<p>Pick a corner or centre position, a starting number, and a format such as <code>{n}</code> or <code>Page {n} of {total}</code>. Numbers are drawn with a standard font directly onto each page.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "client",
  }),

  /* --------------------------- Image & scanning ---------------------------- */
  tool({
    slug: "pdf-to-jpg",
    routePrefix: "tools",
    op: "pdf-to-jpg",
    category: "convert",
    name: "PDF to JPG",
    h1: "Convert PDF to JPG",
    description:
      "Render each PDF page to a high-resolution JPG image.",
    longDescription:
      "<p>Pages are rasterised with <code>pdf.js</code> at a scale you choose (up to 4×). Download images individually or all at once.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "client",
    featured: true,
  }),
  tool({
    slug: "jpg-to-pdf",
    routePrefix: "tools",
    op: "jpg-to-pdf",
    category: "convert",
    name: "JPG to PDF",
    h1: "Convert JPG to PDF",
    description:
      "Combine JPG or PNG images into a single PDF with orientation and margin control.",
    longDescription:
      "<p>Add images, set page size (fit-to-image, A4, or Letter), orientation, and margin, then export one PDF containing every image in order.</p>",
    accept: IMG_ACCEPT,
    capability: "client",
    featured: true,
  }),
  tool({
    slug: "scan-to-pdf",
    routePrefix: "tools",
    op: "scan-to-pdf",
    category: "convert",
    name: "Scan to PDF",
    h1: "Scan documents to PDF",
    description:
      "Use your device camera to capture pages and export them as a PDF.",
    longDescription:
      "<p>Grants camera access on request, lets you capture multiple frames, apply a grayscale/contrast 'document' filter, then bundles the shots into a PDF. Nothing is uploaded.</p>",
    accept: IMG_ACCEPT,
    capability: "client",
  }),

  /* ------------------- Security, signatures & modification ------------------ */
  tool({
    slug: "pdf-editor",
    routePrefix: "tools",
    op: "editor",
    category: "edit",
    name: "PDF Editor",
    h1: "Edit a PDF",
    description:
      "Add text, rectangles, and images on top of any PDF page with a canvas overlay.",
    longDescription:
      "<p>Render a page, drop text boxes and shapes onto it, then burn the overlay into a new PDF. Useful for quick fixes, labels, and callouts.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "client",
  }),
  tool({
    slug: "sign-pdf",
    routePrefix: "tools",
    op: "sign",
    category: "edit",
    name: "Sign PDF",
    h1: "Sign a PDF",
    description:
      "Draw, type, or upload a signature and stamp it onto the document.",
    longDescription:
      "<p>Create a signature with the draw pad, a typed font, or a transparent PNG, then place and resize it on the page you choose. The signature is embedded as an image — this is a visual signature, not a cryptographic one.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "client",
  }),
  tool({
    slug: "watermark",
    routePrefix: "tools",
    op: "watermark",
    category: "edit",
    name: "Watermark PDF",
    h1: "Add a watermark to a PDF",
    description:
      "Stamp text or an image across every page with opacity and rotation control.",
    longDescription:
      "<p>Type watermark text (or upload a logo), then tune opacity, rotation, size, and colour. The stamp is tiled or centred on every page.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "client",
  }),
  tool({
    slug: "protect-pdf",
    routePrefix: "tools",
    op: "protect",
    category: "security",
    name: "Protect PDF",
    h1: "Password-protect a PDF",
    description:
      "Encrypt a PDF with a user password and set permission flags.",
    longDescription:
      "<p>Adds standard PDF encryption with a user (open) password and optional owner password restricting printing and copying. Encryption is applied in the browser with a <code>pdf-lib</code> fork.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "client",
  }),
  tool({
    slug: "unlock-pdf",
    routePrefix: "tools",
    op: "unlock",
    category: "security",
    name: "Unlock PDF",
    h1: "Unlock a PDF",
    description:
      "Remove the password from a PDF you are authorised to open.",
    longDescription:
      "<p>Enter the current password if the file needs one to open, and the tool re-saves it without encryption. Only use this on documents you own or have permission to modify.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "client",
  }),
  tool({
    slug: "redact-pdf",
    routePrefix: "tools",
    op: "redact",
    category: "security",
    name: "Redact PDF",
    h1: "Redact a PDF",
    description:
      "Permanently black out regions by flattening pages to images.",
    longDescription:
      "<p>Draw redaction boxes over a rendered page. On export, affected pages are rasterised with the black boxes burned in and rebuilt — the original text under the marks is gone, not just hidden.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "client",
  }),

  /* --------------------------- Advanced document -------------------------- */
  tool({
    slug: "compress-pdf",
    routePrefix: "tools",
    op: "compress",
    category: "optimize",
    name: "Compress PDF",
    h1: "Compress a PDF",
    description:
      "Shrink file size with object-stream packing and optional image downscaling.",
    longDescription:
      "<p>The 'lossless' mode repacks the file structure. The 'strong' mode additionally rasterises pages at a reduced DPI and JPEG quality you control — best for scan-heavy PDFs.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "client",
    featured: true,
  }),
  tool({
    slug: "ocr-pdf",
    routePrefix: "tools",
    op: "ocr",
    category: "optimize",
    name: "OCR PDF",
    h1: "OCR a scanned PDF",
    description:
      "Extract text from scanned pages with tesseract.js and export a text layer.",
    longDescription:
      "<p>Each page is rendered and passed through the tesseract.js OCR engine (English by default). You get the recognised text as a file, and an optional PDF with an invisible, selectable text layer positioned over the scan.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "beta",
    faq: baseFaq("OCR PDF", [
      {
        question: "How accurate is the OCR?",
        answer:
          "tesseract.js works well on clean, high-contrast scans of printed text. Handwriting, low-resolution scans, and unusual fonts reduce accuracy. Rendering at a higher scale helps.",
      },
      {
        question: "Which languages are supported?",
        answer:
          "English is bundled. Other tesseract language packs can be enabled, but each adds a download the first time it runs.",
      },
    ]),
  }),
  tool({
    slug: "repair-pdf",
    routePrefix: "tools",
    op: "repair",
    category: "optimize",
    name: "Repair PDF",
    h1: "Repair a damaged PDF",
    description:
      "Rebuild a broken cross-reference table and recover readable objects.",
    longDescription:
      "<p>The file is parsed in recovery mode, salvageable pages and objects are copied into a fresh document, and a clean cross-reference table is written. Severely corrupted files may only partially recover.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "beta",
  }),
  tool({
    slug: "compare-pdf",
    routePrefix: "tools",
    op: "compare",
    category: "optimize",
    name: "Compare PDF",
    h1: "Compare two PDFs",
    description:
      "Side-by-side visual diff that highlights changed regions per page.",
    longDescription:
      "<p>Both files are rendered page by page. A pixel-difference pass paints changed areas so you can spot inserted, deleted, or moved content at a glance.</p>",
    accept: PDF_ACCEPT,
    multiple: true,
    capability: "client",
  }),
  tool({
    slug: "pdf-forms",
    routePrefix: "tools",
    op: "forms",
    category: "edit",
    name: "Fill PDF Forms",
    h1: "Fill and flatten PDF forms",
    description:
      "Detect AcroForm fields, fill them in, and export a flattened PDF.",
    longDescription:
      "<p>Interactive text fields, checkboxes, radio groups, and dropdowns are listed with inputs. Fill them and choose whether to keep the form editable or flatten it so values are permanent.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "client",
  }),

  /* ------------------------- Office / conversions ------------------------- */
  tool({
    slug: "pdf-to-word",
    routePrefix: "convert",
    op: "pdf-to-word",
    category: "office",
    name: "PDF to Word",
    h1: "Convert PDF to Word",
    description:
      "Extract the text of a PDF into an editable Word document.",
    longDescription:
      "<p>Text is extracted per page with <code>pdf.js</code>, grouped into paragraphs, and written to a <code>.doc</code> file that opens in Microsoft Word, Google Docs, and LibreOffice. Complex multi-column layouts, tables, and images are not reconstructed.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "beta",
    faq: baseFaq("PDF to Word", [
      {
        question: "Will the formatting be identical?",
        answer:
          "No. This is a text-extraction converter — headings and paragraphs are preserved, but exact fonts, columns, tables, and image placement are not. It is ideal for reusing the words, not for pixel-perfect layout.",
      },
      {
        question: "Does it work on scanned PDFs?",
        answer:
          "Only if the scan already has a text layer. For image-only scans, run the OCR PDF tool first.",
      },
    ]),
  }),
  tool({
    slug: "pdf-to-excel",
    routePrefix: "convert",
    op: "pdf-to-excel",
    category: "office",
    name: "PDF to Excel",
    h1: "Convert PDF to Excel",
    description:
      "Pull tabular text out of a PDF into a CSV spreadsheet.",
    longDescription:
      "<p>The tool reads text positions per page and groups them into rows and columns using coordinate clustering, then writes a <code>.csv</code> that Excel, Numbers, and Sheets open directly. Best on simple, ruled tables.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "beta",
    faq: baseFaq("PDF to Excel", [
      {
        question: "What file do I get?",
        answer:
          "A UTF-8 CSV file. Every spreadsheet app imports CSV, and you can save it as .xlsx from there.",
      },
      {
        question: "How good is table detection?",
        answer:
          "Coordinate-based clustering handles clean gridded tables well. Merged cells, nested headers, and free-form layouts may need manual cleanup.",
      },
    ]),
  }),
  tool({
    slug: "html-to-pdf",
    routePrefix: "convert",
    op: "html-to-pdf",
    category: "office",
    name: "HTML to PDF",
    h1: "Convert HTML to PDF",
    description:
      "Render pasted HTML markup into a paginated PDF.",
    longDescription:
      "<p>Paste an HTML fragment or full document; it is rendered off-screen with <code>html2canvas</code> and paginated into a PDF with <code>jsPDF</code>. Fetching a live URL is not possible from the browser due to cross-origin restrictions — paste the page source instead.</p>",
    accept: "text/html,.html,.htm",
    multiple: false,
    capability: "beta",
    faq: baseFaq("HTML to PDF", [
      {
        question: "Can I give it a website URL?",
        answer:
          "Not from the browser — other sites block cross-origin reads. Paste the HTML source, or use the server-side converter (needs a headless browser, not enabled in this build).",
      },
      {
        question: "Are external stylesheets applied?",
        answer:
          "Inline styles and same-origin CSS are honoured. Remote fonts and stylesheets may be skipped by the renderer.",
      },
    ]),
  }),
  tool({
    slug: "pdf-to-powerpoint",
    routePrefix: "convert",
    op: "pdf-to-powerpoint",
    category: "office",
    name: "PDF to PowerPoint",
    h1: "Convert PDF to PowerPoint",
    description:
      "Turn PDF pages into editable .pptx slides.",
    longDescription:
      "<p>Faithful PDF→PPTX conversion needs server-side layout analysis to rebuild slide shapes and text boxes. That engine is not enabled in this build.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "server",
  }),
  tool({
    slug: "word-to-pdf",
    routePrefix: "convert",
    op: "word-to-pdf",
    category: "office",
    name: "Word to PDF",
    h1: "Convert Word to PDF",
    description: "Render .doc / .docx files to clean PDF.",
    longDescription:
      "<p>Accurate Word→PDF rendering requires a server-side office engine (LibreOffice / Word) to lay out styles, fonts, and pagination. That engine is not enabled in this build.</p>",
    accept:
      ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    multiple: false,
    capability: "server",
  }),
  tool({
    slug: "powerpoint-to-pdf",
    routePrefix: "convert",
    op: "powerpoint-to-pdf",
    category: "office",
    name: "PowerPoint to PDF",
    h1: "Convert PowerPoint to PDF",
    description: "Render .ppt / .pptx slide decks to PDF.",
    longDescription:
      "<p>Slide rendering with correct themes, fonts, and animations-to-static requires a server-side office engine, which is not enabled in this build.</p>",
    accept:
      ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
    multiple: false,
    capability: "server",
  }),
  tool({
    slug: "excel-to-pdf",
    routePrefix: "convert",
    op: "excel-to-pdf",
    category: "office",
    name: "Excel to PDF",
    h1: "Convert Excel to PDF",
    description: "Format .xls / .xlsx spreadsheets into print-ready PDF.",
    longDescription:
      "<p>Spreadsheet pagination, print areas, and cell styling need a server-side office engine to match desktop output. That engine is not enabled in this build.</p>",
    accept:
      ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    multiple: false,
    capability: "server",
  }),
  tool({
    slug: "pdf-to-pdfa",
    routePrefix: "convert",
    op: "pdf-to-pdfa",
    category: "office",
    name: "PDF to PDF/A",
    h1: "Convert PDF to PDF/A",
    description:
      "Transform a PDF into ISO 19005 PDF/A for long-term archiving.",
    longDescription:
      "<p>PDF/A conformance requires embedding all fonts, colour profiles, and XMP metadata, then validating against the ISO profile — a job for a server-side tool such as Ghostscript or veraPDF. Not enabled in this build.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "server",
  }),
  tool({
    slug: "translate-pdf",
    routePrefix: "tools",
    op: "translate",
    category: "optimize",
    name: "Translate PDF",
    h1: "Translate a PDF",
    description:
      "Translate PDF text while keeping the original layout.",
    longDescription:
      "<p>Layout-preserving translation sends extracted text to a machine-translation API and reflows it into the page. No translation API key is configured in this build, so the tool runs in preview mode only.</p>",
    accept: PDF_ACCEPT,
    multiple: false,
    capability: "server",
  }),
];

export function pdfToolBySlug(slug: string): PdfToolDef | undefined {
  return PDF_TOOLS.find((t) => t.slug === slug);
}

export function pdfToolsByPrefix(prefix: "tools" | "convert"): PdfToolDef[] {
  return PDF_TOOLS.filter((t) => t.routePrefix === prefix);
}

export const PDF_TOOL_CATEGORIES = [
  { id: "organize", label: "Organize" },
  { id: "convert", label: "Convert & scan" },
  { id: "edit", label: "Edit & sign" },
  { id: "security", label: "Security" },
  { id: "optimize", label: "Optimize & AI" },
  { id: "office", label: "Office formats" },
] as const;
