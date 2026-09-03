"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/dropzone";
import { OptionFields, defaultsFor } from "./option-fields";
import { DownloadList } from "./download-list";
import { ocr, type OpFile, type OpOptions } from "@/lib/pdf/ops";
import { track, logConversion } from "@/lib/track";

export function OcrWorkspace({ slug }: { slug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<OpOptions>(() => defaultsFor("ocr"));
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(
    null,
  );
  const [result, setResult] = useState<OpFile[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress({ pct: 0, label: "starting" });
    const started = performance.now();
    try {
      const res = await ocr([file], options, (fraction, label) =>
        setProgress({ pct: Math.round(fraction * 100), label }),
      );
      setResult(res.files);
      setNote(res.note ?? null);
      track({ type: "CONVERSION", path: `/tools/${slug}`, toolSlug: slug });
      logConversion({
        toolSlug: slug,
        fromFormat: "ocr",
        toFormat: "txt",
        fileName: file.name,
        fileSize: file.size,
        durationMs: Math.round(performance.now() - started),
        success: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "OCR failed.";
      setError(message);
      logConversion({
        toolSlug: slug,
        fromFormat: "ocr",
        toFormat: "txt",
        fileName: file?.name,
        durationMs: Math.round(performance.now() - started),
        success: false,
        error: message,
      });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      {!file ? (
        <Dropzone
          accept="application/pdf,.pdf"
          multiple={false}
          onFiles={(f) => {
            setFile(f[0]);
            setResult(null);
            setError(null);
          }}
        />
      ) : (
        <div className="space-y-4">
          <p className="truncate rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
            {file.name}
          </p>

          {!result && <OptionFields op="ocr" values={options} onChange={setOptions} />}

          {progress && (
            <div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-sky-500 transition-all"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {progress.label} — {progress.pct}%
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {note && (
            <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800 dark:bg-sky-950/50 dark:text-sky-200">
              {note}
            </p>
          )}
          {result && <DownloadList files={result} />}

          <div className="flex flex-wrap gap-2">
            {!result && (
              <Button size="lg" onClick={run} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : "Run OCR"}
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
            >
              Choose another file
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
