"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { PdfOp, ToolCapability } from "@/lib/pdf/catalog";

// ssr:false is only valid from within a Client Component boundary — this file
// is that boundary. Keeps pdf.js / tesseract.js / pdf-lib out of the server
// bundle and off the initial client bundle until the workspace actually mounts.
const PdfWorkspace = dynamic(
  () => import("./pdf-workspace").then((m) => m.PdfWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <Loader2 className="size-6 animate-spin text-sky-500" />
      </div>
    ),
  },
);

export function PdfWorkspaceLoader(props: {
  slug: string;
  op: PdfOp;
  name: string;
  accept: string;
  multiple: boolean;
  capability: ToolCapability;
  conversionConfigured?: boolean;
}) {
  return <PdfWorkspace {...props} />;
}
