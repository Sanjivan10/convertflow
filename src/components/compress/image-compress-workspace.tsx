"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { Dropzone } from "@/components/dropzone";
import { toast } from "@/components/ui/toast";
import { formatBytes } from "@/lib/utils";
import { track, logConversion } from "@/lib/track";
import {
  compressImage,
  type CompressedFile,
  type CompressOptions,
} from "@/lib/compress/image";

const DEFAULTS: CompressOptions = {
  quality: 78,
  maxDimension: 0,
  format: "keep",
  targetKb: 0,
  colors: 0,
};

export function ImageCompressWorkspace({
  slug,
  accept,
  allowFormatSwitch = true,
  pngMode = false,
}: {
  slug: string;
  accept: string;
  allowFormatSwitch?: boolean;
  pngMode?: boolean;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [opts, setOpts] = useState<CompressOptions>({
    ...DEFAULTS,
    ...(pngMode ? { format: "png", colors: 128 } : {}),
  });
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<CompressedFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<CompressedFile[] | null>(null);

  const revoke = useCallback(() => {
    resultsRef.current?.forEach((r) => URL.revokeObjectURL(r.url));
  }, []);
  useEffect(() => () => revoke(), [revoke]);

  const set = <K extends keyof CompressOptions>(k: K, v: CompressOptions[K]) =>
    setOpts((o) => ({ ...o, [k]: v }));

  const run = async () => {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    const started = performance.now();
    try {
      const out: CompressedFile[] = [];
      for (const f of files) {
        out.push(await compressImage(f, opts));
        await new Promise((r) => setTimeout(r, 0));
      }
      revoke();
      resultsRef.current = out;
      setResults(out);
      const saved =
        1 -
        out.reduce((a, r) => a + r.size, 0) /
          out.reduce((a, r) => a + r.originalSize, 0);
      toast(
        saved > 0.02
          ? `Done — ${Math.round(saved * 100)}% smaller.`
          : "Done — already near-optimal.",
        saved > 0.02 ? "success" : "info",
      );
      track({
        type: "CONVERSION",
        path: `/compress/${slug}`,
        toolSlug: slug,
        meta: { count: files.length },
      });
      logConversion({
        toolSlug: slug,
        fromFormat: "image",
        toFormat: opts.format === "keep" ? "image" : opts.format,
        fileName: files[0]?.name,
        fileSize: files.reduce((a, f) => a + f.size, 0),
        durationMs: Math.round(performance.now() - started),
        success: true,
      });
    } catch (err) {
      const m = err instanceof Error ? err.message : "Compression failed.";
      setError(m);
      toast(m, "error");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    revoke();
    resultsRef.current = null;
    setFiles([]);
    setResults(null);
    setError(null);
  };

  const save = (r: CompressedFile) => {
    const a = document.createElement("a");
    a.href = r.url;
    a.download = r.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      {files.length === 0 ? (
        <Dropzone
          accept={accept}
          onFiles={(f) => {
            setFiles(f);
            setResults(null);
            setError(null);
          }}
        />
      ) : (
        <div className="space-y-4">
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <span className="truncate text-slate-700 dark:text-slate-200">
                  {f.name}
                </span>
                <span className="flex items-center gap-2 text-xs text-slate-400">
                  {formatBytes(f.size)}
                  {!busy && !results && (
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label={`Remove ${f.name}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {!results && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="q">Quality</Label>
                  <span className="text-xs tabular-nums text-slate-400">
                    {opts.quality}%
                  </span>
                </div>
                <input
                  id="q"
                  type="range"
                  min={10}
                  max={100}
                  value={opts.quality}
                  onChange={(e) => set("quality", Number(e.target.value))}
                  className="w-full accent-sky-600"
                  disabled={pngMode && opts.format === "png"}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="md">Max width/height</Label>
                <Select
                  id="md"
                  value={String(opts.maxDimension)}
                  onChange={(e) => set("maxDimension", Number(e.target.value))}
                >
                  <option value="0">Keep original</option>
                  <option value="3840">3840 px (4K)</option>
                  <option value="1920">1920 px (Full HD)</option>
                  <option value="1280">1280 px</option>
                  <option value="800">800 px</option>
                </Select>
              </div>

              {allowFormatSwitch && (
                <div className="space-y-1.5">
                  <Label htmlFor="fmt">Output format</Label>
                  <Select
                    id="fmt"
                    value={opts.format}
                    onChange={(e) =>
                      set("format", e.target.value as CompressOptions["format"])
                    }
                  >
                    <option value="keep">Keep original</option>
                    <option value="jpeg">JPG (smallest for photos)</option>
                    <option value="webp">WebP (best overall)</option>
                    <option value="png">PNG (lossless)</option>
                  </Select>
                </div>
              )}

              {opts.format === "png" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="col">Colours</Label>
                  <Select
                    id="col"
                    value={String(opts.colors)}
                    onChange={(e) => set("colors", Number(e.target.value))}
                  >
                    <option value="0">Full (no reduction)</option>
                    <option value="256">256</option>
                    <option value="128">128</option>
                    <option value="64">64</option>
                    <option value="32">32</option>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="tk">Target size (optional)</Label>
                  <Select
                    id="tk"
                    value={String(opts.targetKb)}
                    onChange={(e) => set("targetKb", Number(e.target.value))}
                  >
                    <option value="0">No target — use quality</option>
                    <option value="1000">≤ 1 MB</option>
                    <option value="500">≤ 500 KB</option>
                    <option value="200">≤ 200 KB</option>
                    <option value="100">≤ 100 KB</option>
                  </Select>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </p>
          )}

          {results && (
            <ul className="space-y-2">
              {results.map((r) => {
                const pct = Math.round((1 - r.size / r.originalSize) * 100);
                return (
                  <li
                    key={r.url}
                    className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm dark:bg-emerald-950/40"
                  >
                    <span className="truncate text-emerald-900 dark:text-emerald-200">
                      {r.name}{" "}
                      <span className="text-emerald-600/70">
                        {formatBytes(r.originalSize)} → {formatBytes(r.size)}
                        {pct > 0 ? ` (−${pct}%)` : ""}
                      </span>
                    </span>
                    <Button size="sm" onClick={() => save(r)}>
                      <Download /> Save
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-wrap gap-2">
            {!results && (
              <Button
                size="lg"
                onClick={run}
                disabled={busy || files.length === 0}
              >
                {busy ? (
                  <>
                    <Loader2 className="animate-spin" /> Compressing…
                  </>
                ) : (
                  "Compress"
                )}
              </Button>
            )}
            {results && results.length > 1 && (
              <Button
                size="lg"
                onClick={() =>
                  results.forEach((r, i) => setTimeout(() => save(r), i * 200))
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
      <p className="mt-3 text-center text-xs text-slate-400">
        Runs entirely in your browser — files are never uploaded.
      </p>
    </div>
  );
}
