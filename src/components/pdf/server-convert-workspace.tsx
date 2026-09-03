"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, ServerCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { Dropzone } from "@/components/dropzone";
import { formatBytes } from "@/lib/utils";
import { track, logConversion } from "@/lib/track";

type Phase = "idle" | "ready" | "working" | "done" | "error";

export function ServerConvertWorkspace({
  slug,
  op,
  name,
  accept,
  actionLabel,
  configured,
  showQuality = false,
}: {
  slug: string;
  op: string;
  name: string;
  accept: string;
  actionLabel: string;
  configured: boolean;
  showQuality?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [quality, setQuality] = useState(70);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(
    null,
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (result) URL.revokeObjectURL(result.url);
      abortRef.current?.abort();
    },
    [result],
  );

  if (!configured) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30 sm:p-10">
        <ServerCog className="mx-auto size-8 text-amber-500" />
        <h2 className="mt-3 font-semibold text-amber-900 dark:text-amber-200">
          {name} needs a conversion service
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-amber-800/80 dark:text-amber-300/80">
          This tool converts documents through a server-side engine. It just
          needs an API key. An admin can enable it by setting{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
            CONVERSION_PROVIDER
          </code>{" "}
          and{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
            CONVERSION_API_KEY
          </code>{" "}
          in the deployment settings (ConvertAPI, Cloudmersive, or a self-hosted
          Gotenberg URL).
        </p>
      </div>
    );
  }

  const MAX_MB = 25;

  const pickFile = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      toast(`That file is over the ${MAX_MB} MB limit.`, "error");
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
    setPhase("ready");
  };

  const reset = () => {
    if (result) URL.revokeObjectURL(result.url);
    if (timerRef.current) clearInterval(timerRef.current);
    abortRef.current?.abort();
    setFile(null);
    setResult(null);
    setError(null);
    setElapsed(0);
    setPhase("idle");
  };

  const run = async () => {
    if (!file) return;
    setPhase("working");
    setError(null);
    setElapsed(0);
    const startedAt = performance.now();
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const clientTimeout = setTimeout(() => ctrl.abort(), 120_000);

    try {
      const body = new FormData();
      body.set("op", op);
      body.set("file", file);
      if (showQuality) body.set("quality", String(quality));
      const res = await fetch("/api/convert/document", {
        method: "POST",
        body,
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Conversion failed (${res.status}).`);
      }

      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const nameMatch = cd.match(/filename="?([^"]+)"?/);
      const outName =
        nameMatch?.[1] || file.name.replace(/\.[^.]+$/, "") + ".pdf";
      const url = URL.createObjectURL(blob);
      setResult({ url, name: outName, size: blob.size });
      setPhase("done");
      toast("Conversion complete.", "success");

      track({
        type: "CONVERSION",
        path: `/convert/${slug}`,
        toolSlug: slug,
        meta: { op },
      });
      logConversion({
        toolSlug: slug,
        fromFormat: file.name.split(".").pop()?.toLowerCase() || "doc",
        toFormat: "pdf",
        fileName: file.name,
        fileSize: file.size,
        durationMs: Math.round(performance.now() - startedAt),
        success: true,
      });
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      const message = aborted
        ? "The conversion timed out. Try a smaller file."
        : err instanceof Error
          ? err.message
          : "Conversion failed.";
      setError(message);
      setPhase("error");
      toast(message, "error");
      logConversion({
        toolSlug: slug,
        fromFormat: file.name.split(".").pop()?.toLowerCase() || "doc",
        toFormat: "pdf",
        fileName: file.name,
        durationMs: Math.round(performance.now() - startedAt),
        success: false,
        error: message,
      });
    } finally {
      clearTimeout(clientTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = result.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      {phase === "idle" ? (
        <Dropzone accept={accept} multiple={false} onFiles={pickFile} />
      ) : (
        <div className="space-y-4">
          {file && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              <span className="truncate text-slate-700 dark:text-slate-200">
                {file.name}
              </span>
              <span className="text-xs text-slate-400">
                {formatBytes(file.size)}
              </span>
            </div>
          )}

          {showQuality && phase === "ready" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="sq">Quality</Label>
                <span className="text-xs tabular-nums text-slate-400">
                  {quality}%{quality <= 45 ? " — smallest" : quality >= 85 ? " — best" : ""}
                </span>
              </div>
              <input
                id="sq"
                type="range"
                min={20}
                max={95}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-sky-600"
              />
            </div>
          )}

          {phase === "working" && (
            <div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full w-1/3 animate-[progress_1.2s_ease-in-out_infinite] rounded-full bg-sky-500" />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Converting on the server… {elapsed}s
                {elapsed > 20 ? " — large files can take up to a minute." : ""}
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </p>
          )}

          {result && phase === "done" && (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm dark:bg-emerald-950/40">
              <span className="truncate text-emerald-900 dark:text-emerald-200">
                {result.name}{" "}
                <span className="text-emerald-600/70">
                  ({formatBytes(result.size)})
                </span>
              </span>
              <Button size="sm" onClick={download}>
                Download
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {phase !== "done" && (
              <Button
                size="lg"
                onClick={run}
                disabled={phase === "working" || !file}
              >
                {phase === "working" ? (
                  <>
                    <Loader2 className="animate-spin" /> Converting…
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
        </div>
      )}
      <p className="mt-3 text-center text-xs text-slate-400">
        {name} · processed on the server, then deleted. Max {MAX_MB} MB.
      </p>

      <style>{`@keyframes progress{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}`}</style>
    </div>
  );
}
