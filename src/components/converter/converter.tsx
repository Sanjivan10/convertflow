"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, RotateCcw, X } from "lucide-react";
import { Dropzone } from "@/components/dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { cn, formatBytes } from "@/lib/utils";
import { logConversion, track } from "@/lib/track";
import {
  DEFAULT_OPTIONS,
  runConversion,
  type ConvertResult,
  type Engine,
} from "@/lib/convert";

type ConverterProps = {
  slug: string;
  name: string;
  fromFormat: string;
  toFormat: string;
  engine: Engine;
  accept: string;
  customScript?: string;
};

type Phase = "idle" | "ready" | "working" | "done" | "error";

const LOSSY = new Set(["JPG", "JPEG", "WEBP"]);

export function Converter({
  slug,
  name,
  fromFormat,
  toFormat,
  engine,
  accept,
  customScript = "",
}: ConverterProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState(Math.round(DEFAULT_OPTIONS.quality * 100));
  const resultRef = useRef<ConvertResult | null>(null);

  const showQuality = engine === "IMAGE" && LOSSY.has(toFormat.toUpperCase());

  const revokeAll = useCallback(() => {
    resultRef.current?.files.forEach((f) => URL.revokeObjectURL(f.url));
  }, []);

  useEffect(() => () => revokeAll(), [revokeAll]);

  const addFiles = useCallback((incoming: File[]) => {
    setError(null);
    setResult(null);
    setPhase("ready");
    setFiles((prev) => [...prev, ...incoming]);
  }, []);

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const reset = () => {
    revokeAll();
    resultRef.current = null;
    setFiles([]);
    setResult(null);
    setError(null);
    setPhase("idle");
  };

  const run = async () => {
    if (files.length === 0) return;
    setPhase("working");
    setError(null);
    const startedAt = performance.now();
    try {
      const res = await runConversion(
        engine,
        {
          files,
          fromFormat,
          toFormat,
          options: { ...DEFAULT_OPTIONS, quality: quality / 100 },
        },
        customScript,
      );
      revokeAll();
      resultRef.current = res;
      setResult(res);
      setPhase("done");
      track({
        type: "CONVERSION",
        path: `/convert/${slug}`,
        toolSlug: slug,
        meta: { count: files.length, toFormat },
      });
      logConversion({
        toolSlug: slug,
        fromFormat,
        toFormat,
        fileName: files[0]?.name,
        fileSize: files.reduce((a, f) => a + f.size, 0),
        durationMs: Math.round(performance.now() - startedAt),
        success: true,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Conversion failed unexpectedly.";
      setError(message);
      setPhase("error");
      logConversion({
        toolSlug: slug,
        fromFormat,
        toFormat,
        fileName: files[0]?.name,
        durationMs: Math.round(performance.now() - startedAt),
        success: false,
        error: message,
      });
    }
  };

  const downloadOne = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      {phase === "idle" ? (
        <Dropzone accept={accept} onFiles={addFiles} />
      ) : (
        <div className="space-y-4">
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {files.map((file, idx) => (
              <li
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <span className="truncate text-slate-700 dark:text-slate-200">
                  {file.name}
                </span>
                <span className="flex items-center gap-2 text-xs text-slate-400">
                  {formatBytes(file.size)}
                  {phase !== "working" && (
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {phase !== "working" && (
            <Dropzone accept={accept} onFiles={addFiles} compact />
          )}

          {showQuality && phase !== "done" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="quality">Quality</Label>
                <span className="text-xs tabular-nums text-slate-500">
                  {quality}%
                </span>
              </div>
              <input
                id="quality"
                type="range"
                min={10}
                max={100}
                step={1}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-sky-600"
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </p>
          )}

          {result && phase === "done" && (
            <ul className="space-y-2">
              {result.files.map((f) => (
                <li
                  key={f.url}
                  className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm dark:bg-emerald-950/40"
                >
                  <span className="truncate text-emerald-900 dark:text-emerald-200">
                    {f.name}{" "}
                    <span className="text-emerald-600/70">
                      ({formatBytes(f.size)})
                    </span>
                  </span>
                  <Button
                    size="sm"
                    onClick={() => downloadOne(f.url, f.name)}
                  >
                    <Download /> Download
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2">
            {phase !== "done" && (
              <Button
                onClick={run}
                disabled={phase === "working" || files.length === 0}
                size="lg"
              >
                {phase === "working" ? (
                  <>
                    <Loader2 className="animate-spin" /> Converting…
                  </>
                ) : (
                  `Convert to ${toFormat}`
                )}
              </Button>
            )}
            {phase === "done" && result && result.files.length > 1 && (
              <Button
                size="lg"
                onClick={() =>
                  result.files.forEach((f, i) =>
                    setTimeout(() => downloadOne(f.url, f.name), i * 250),
                  )
                }
              >
                <Download /> Download all
              </Button>
            )}
            <Button variant="outline" size="lg" onClick={reset}>
              <RotateCcw /> Start over
            </Button>
          </div>
        </div>
      )}
      <p
        className={cn(
          "mt-3 text-center text-xs text-slate-400",
          phase === "working" && "text-sky-500",
        )}
      >
        {name} · runs entirely on your device
      </p>
    </div>
  );
}
