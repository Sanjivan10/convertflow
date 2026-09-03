"use client";

import { GripVertical, X } from "lucide-react";
import { useRef, useState } from "react";
import { Dropzone } from "@/components/dropzone";
import { formatBytes } from "@/lib/utils";

export function FilePicker({
  accept,
  multiple,
  files,
  onChange,
  reorderable,
}: {
  accept: string;
  multiple: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  reorderable?: boolean;
}) {
  const dragIndex = useRef<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const add = (incoming: File[]) =>
    onChange(multiple ? [...files, ...incoming] : incoming.slice(0, 1));
  const removeAt = (i: number) => onChange(files.filter((_, idx) => idx !== i));

  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...files];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {(multiple || files.length === 0) && (
        <Dropzone
          accept={accept}
          multiple={multiple}
          onFiles={add}
          compact={files.length > 0}
        />
      )}

      {files.length > 0 && (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              draggable={reorderable && files.length > 1}
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex.current !== null) move(dragIndex.current, i);
                dragIndex.current = null;
                setOver(null);
              }}
              onDragEnd={() => setOver(null)}
              className={`flex items-center gap-2 px-3 py-2 text-sm ${
                over === i ? "bg-sky-50 dark:bg-sky-950/40" : ""
              }`}
            >
              {reorderable && files.length > 1 && (
                <GripVertical className="size-4 shrink-0 cursor-grab text-slate-400" />
              )}
              <span className="w-5 shrink-0 text-xs tabular-nums text-slate-400">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">
                {file.name}
              </span>
              <span className="shrink-0 text-xs text-slate-400">
                {formatBytes(file.size)}
              </span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="shrink-0 rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
