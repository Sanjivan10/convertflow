"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

type DropzoneProps = {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  className?: string;
  /** Reserve vertical space to avoid layout shift. */
  compact?: boolean;
};

export function Dropzone({
  accept,
  multiple = true,
  onFiles,
  className,
  compact,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      onFiles(Array.from(list));
    },
    [onFiles],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center transition-colors hover:border-sky-400 hover:bg-sky-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-900/50",
        dragging && "border-sky-500 bg-sky-50 dark:bg-sky-950/40",
        compact ? "min-h-[160px] p-6" : "min-h-[260px] p-10",
        className,
      )}
    >
      <UploadCloud className="mb-3 size-10 text-sky-500" />
      <p className="text-base font-medium text-slate-700 dark:text-slate-200">
        Drop files here or <span className="text-sky-600">browse</span>
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Files are processed in your browser and never uploaded
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
