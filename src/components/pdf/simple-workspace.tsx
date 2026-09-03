"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logConversion, track } from "@/lib/track";
import { runSimpleOp, type OpFile, type OpOptions } from "@/lib/pdf/ops";
import { FilePicker } from "./file-picker";
import { OptionFields, defaultsFor } from "./option-fields";
import { DownloadList } from "./download-list";

export function SimpleWorkspace({
  slug,
  op,
  accept,
  multiple,
  actionLabel,
}: {
  slug: string;
  op: string;
  accept: string;
  multiple: boolean;
  actionLabel: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<OpOptions>(() => defaultsFor(op));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OpFile[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setNote(null);
    const started = performance.now();
    try {
      const res = await runSimpleOp(op, files, options);
      setResult(res.files);
      setNote(res.note ?? null);
      track({
        type: "CONVERSION",
        path: `/tools/${slug}`,
        toolSlug: slug,
        meta: { op, files: files.length },
      });
      logConversion({
        toolSlug: slug,
        fromFormat: op,
        toFormat: "pdf",
        fileName: files[0]?.name,
        fileSize: files.reduce((a, f) => a + f.size, 0),
        durationMs: Math.round(performance.now() - started),
        success: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Processing failed.";
      setError(message);
      logConversion({
        toolSlug: slug,
        fromFormat: op,
        toFormat: "pdf",
        durationMs: Math.round(performance.now() - started),
        success: false,
        error: message,
      });
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setResult(null);
    setNote(null);
    setError(null);
    setOptions(defaultsFor(op));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      <FilePicker
        accept={accept}
        multiple={multiple}
        files={files}
        onChange={(f) => {
          setFiles(f);
          setResult(null);
          setError(null);
        }}
        reorderable={op === "merge" || op === "jpg-to-pdf"}
      />

      {files.length > 0 && !result && (
        <div className="mt-4">
          <OptionFields op={op} values={options} onChange={setOptions} />
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </p>
      )}

      {note && (
        <p className="mt-4 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800 dark:bg-sky-950/50 dark:text-sky-200">
          {note}
        </p>
      )}

      {result && (
        <div className="mt-4">
          <DownloadList files={result} />
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {!result && (
          <Button size="lg" onClick={run} disabled={busy || files.length === 0}>
            {busy ? (
              <>
                <Loader2 className="animate-spin" /> Working…
              </>
            ) : (
              actionLabel
            )}
          </Button>
        )}
        <Button variant="outline" size="lg" onClick={reset}>
          <RotateCcw /> Start over
        </Button>
      </div>

      <p className="mt-3 text-center text-xs text-slate-400">
        Runs entirely in your browser — files are never uploaded.
      </p>
    </div>
  );
}
