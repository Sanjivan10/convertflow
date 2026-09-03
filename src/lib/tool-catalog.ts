import type { FaqItem } from "@/lib/seo";

export type ToolEngine = "IMAGE" | "PDF" | "CUSTOM";
export type ToolStatus = "DRAFT" | "PUBLISHED";

export type ToolDef = {
  slug: string;
  name: string;
  category: string;
  fromFormat: string;
  toFormat: string;
  description: string;
  longDescription: string;
  accept: string;
  engine: ToolEngine;
  customScript?: string;
  status: ToolStatus;
  metaTitle?: string;
  metaDescription?: string;
  faq: FaqItem[];
  featured?: boolean;
};

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/bmp,.png,.jpg,.jpeg,.webp,.gif,.bmp";

function imageFaq(from: string, to: string): FaqItem[] {
  return [
    {
      question: `How do I convert ${from} to ${to}?`,
      answer: `Drop your ${from} file into the box above, wait a moment while it is processed in your browser, then download the ${to} result. Nothing is uploaded to a server.`,
    },
    {
      question: `Is this ${from} to ${to} converter free?`,
      answer:
        "Yes. Every tool on ConvertFlow is free to use with no sign-up, no watermark, and no file-count limits.",
    },
    {
      question: "Are my files private?",
      answer:
        "The conversion runs entirely in your browser using the Canvas API. Your files never leave your device.",
    },
    {
      question: `Can I convert multiple ${from} files at once?`,
      answer: `Yes — add several ${from} files and each one is converted to ${to} and offered as a separate download.`,
    },
  ];
}

function imageTool(
  from: string,
  to: string,
  opts: { featured?: boolean } = {},
): ToolDef {
  const fromLc = from.toLowerCase();
  const toLc = to.toLowerCase();
  return {
    slug: `${fromLc}-to-${toLc}`,
    name: `${from} to ${to} Converter`,
    category: "image",
    fromFormat: from,
    toFormat: to,
    description: `Convert ${from} images to ${to} online — free, private, and instant.`,
    longDescription: `<p>This tool converts <strong>${from}</strong> images to <strong>${to}</strong> directly in your browser. The file is decoded onto an HTML canvas and re-encoded as ${to}, so it never touches a server and the conversion finishes in milliseconds.</p><p>${to === "JPG" ? "JPG uses lossy compression and does not support transparency — transparent areas are flattened onto a white background." : to === "PNG" ? "PNG is lossless and preserves transparency, which makes it ideal for logos, icons, and screenshots." : to === "WEBP" ? "WebP produces significantly smaller files than JPG or PNG at the same visual quality, which improves page-load performance and Core Web Vitals." : ""}</p>`,
    accept: IMAGE_ACCEPT,
    engine: "IMAGE",
    status: "PUBLISHED",
    metaTitle: `${from} to ${to} — Free Online Converter | ConvertFlow`,
    metaDescription: `Free ${from} to ${to} converter. Batch convert ${from} to ${to} in your browser with no upload, no watermark, and no sign-up.`,
    faq: imageFaq(from, to),
    featured: opts.featured,
  };
}

// Note: PDF-native tools (merge, split, jpg-to-pdf, compress, etc.) live in
// `@/lib/pdf/catalog` and are served under /tools/[slug] — see that module for
// the full PDF suite. This catalog stays scoped to raster image conversions.

export const TOOL_CATALOG: ToolDef[] = [
  imageTool("PNG", "JPG", { featured: true }),
  imageTool("JPG", "PNG", { featured: true }),
  imageTool("PNG", "WEBP", { featured: true }),
  imageTool("WEBP", "PNG", { featured: true }),
  imageTool("JPG", "WEBP"),
  imageTool("WEBP", "JPG"),
  imageTool("HEIC", "JPG"),
  imageTool("GIF", "PNG"),
  imageTool("BMP", "PNG"),
  imageTool("PNG", "BMP"),
  imageTool("JPEG", "PNG"),
  imageTool("PNG", "JPEG"),
  imageTool("WEBP", "GIF"),
  imageTool("GIF", "JPG"),
];

export function catalogBySlug(slug: string): ToolDef | undefined {
  return TOOL_CATALOG.find((tool) => tool.slug === slug);
}
