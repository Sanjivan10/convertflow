"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import type { OpFile } from "@/lib/pdf/ops";

export function DownloadList({ files }: { files: OpFile[] }) {
  if (files.length === 0) return null;

  const save = (file: OpFile) => {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div className="space-y-2">
      {files.length > 1 && (
        <Button
          onClick={() => files.forEach((f, i) => setTimeout(() => save(f), i * 200))}
          className="w-full"
        >
          <Download /> Download all ({files.length})
        </Button>
      )}
      <ul className="space-y-1.5">
        {files.map((file, i) => (
          <li
            key={`${file.name}-${i}`}
            className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm dark:bg-emerald-950/40"
          >
            <span className="truncate text-emerald-900 dark:text-emerald-200">
              {file.name}
              <span className="ml-2 text-emerald-600/70">
                {formatBytes(file.blob.size)}
              </span>
            </span>
            <Button size="sm" onClick={() => save(file)}>
              <Download /> Save
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
