"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const spinner = () => (
  <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
    <Loader2 className="size-6 animate-spin text-sky-500" />
  </div>
);

const ImageCompressWorkspace = dynamic(
  () =>
    import("@/components/compress/image-compress-workspace").then(
      (m) => m.ImageCompressWorkspace,
    ),
  { ssr: false, loading: spinner },
);

const ServerConvertWorkspace = dynamic(
  () =>
    import("@/components/pdf/server-convert-workspace").then(
      (m) => m.ServerConvertWorkspace,
    ),
  { ssr: false, loading: spinner },
);

export function CompressWorkspaceLoader({
  slug,
  engine,
  serverOp,
  name,
  accept,
  conversionConfigured = false,
}: {
  slug: string;
  engine: "image" | "server";
  serverOp?: string;
  name: string;
  accept: string;
  conversionConfigured?: boolean;
}) {
  if (engine === "image") {
    return (
      <ImageCompressWorkspace
        slug={slug}
        accept={accept}
        allowFormatSwitch={slug !== "jpeg-compressor"}
        pngMode={slug === "png-compressor"}
      />
    );
  }
  return (
    <ServerConvertWorkspace
      slug={slug}
      op={serverOp ?? "gif-compress"}
      name={name}
      accept={accept}
      actionLabel="Compress"
      configured={conversionConfigured}
      showQuality
    />
  );
}
