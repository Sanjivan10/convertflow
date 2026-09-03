"use client";

// Single entry point every PDF tool page renders. Always loaded via
// `next/dynamic(() => import(...), { ssr: false })` so pdf.js / tesseract.js /
// pdf-lib stay out of the server bundle and the initial client bundle.
import type { PdfOp, ToolCapability } from "@/lib/pdf/catalog";
import { SimpleWorkspace } from "./simple-workspace";
import { OrganizeWorkspace } from "./organize-workspace";
import { SignWorkspace } from "./sign-workspace";
import { AnnotateWorkspace } from "./annotate-workspace";
import { FormsWorkspace } from "./forms-workspace";
import { CompareWorkspace } from "./compare-workspace";
import { HtmlWorkspace } from "./html-workspace";
import { ScanWorkspace } from "./scan-workspace";
import { OcrWorkspace } from "./ocr-workspace";
import { UnavailableWorkspace } from "./unavailable-workspace";

const SIMPLE_OPS = new Set<PdfOp>([
  "merge",
  "split",
  "rotate",
  "crop",
  "page-numbers",
  "watermark",
  "pdf-to-jpg",
  "jpg-to-pdf",
  "compress",
  "repair",
  "unlock",
  "protect",
  "pdf-to-word",
  "pdf-to-excel",
]);

const ACTION_LABEL: Partial<Record<PdfOp, string>> = {
  merge: "Merge & download",
  split: "Split & download",
  rotate: "Rotate & download",
  crop: "Crop & download",
  "page-numbers": "Add numbers & download",
  watermark: "Add watermark & download",
  "pdf-to-jpg": "Convert to JPG",
  "jpg-to-pdf": "Build PDF",
  compress: "Compress & download",
  repair: "Repair & download",
  unlock: "Unlock & download",
  protect: "Encrypt & download",
  "pdf-to-word": "Convert to Word",
  "pdf-to-excel": "Convert to Excel",
};

export function PdfWorkspace({
  slug,
  op,
  name,
  accept,
  multiple,
  capability,
}: {
  slug: string;
  op: PdfOp;
  name: string;
  accept: string;
  multiple: boolean;
  capability: ToolCapability;
}) {
  if (capability === "server") {
    return <UnavailableWorkspace name={name} />;
  }

  if (SIMPLE_OPS.has(op)) {
    return (
      <SimpleWorkspace
        slug={slug}
        op={op}
        accept={accept}
        multiple={multiple}
        actionLabel={ACTION_LABEL[op] ?? "Process & download"}
      />
    );
  }

  switch (op) {
    case "organize":
      return <OrganizeWorkspace slug={slug} />;
    case "sign":
      return <SignWorkspace slug={slug} />;
    case "redact":
      return <AnnotateWorkspace slug={slug} mode="redact" />;
    case "editor":
      return <AnnotateWorkspace slug={slug} mode="editor" />;
    case "forms":
      return <FormsWorkspace slug={slug} />;
    case "compare":
      return <CompareWorkspace />;
    case "html-to-pdf":
      return <HtmlWorkspace slug={slug} />;
    case "scan-to-pdf":
      return <ScanWorkspace slug={slug} />;
    case "ocr":
      return <OcrWorkspace slug={slug} />;
    default:
      return <UnavailableWorkspace name={name} />;
  }
}
