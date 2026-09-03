"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/dropzone";
import { Label } from "@/components/ui/input";
import { track, logConversion } from "@/lib/track";
import { stampImage, type OpFile } from "@/lib/pdf/ops";
import { usePdfPages } from "./use-pdf-pages";
import { SignaturePad } from "./signature-pad";
import { DownloadList } from "./download-list";

export function SignWorkspace({ slug }: { slug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const { pages, loading } = usePdfPages(file, 0.9);
  const [sig, setSig] = useState<string | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [pos, setPos] = useState({ x: 0.55, y: 0.8 });
  const [widthPct, setWidthPct] = useState(0.28);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OpFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const frame = useRef<HTMLDivElement>(null);

  const place = (e: React.MouseEvent) => {
    const rect = frame.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const run = async () => {
    if (!file || !sig) return;
    setBusy(true);
    setError(null);
    const started = performance.now();
    try {
      const res = await stampImage(file, sig, {
        page: pageIdx + 1,
        xPct: pos.x,
        yPct: pos.y,
        wPct: widthPct,
      });
      setResult(res.files);
      track({ type: "CONVERSION", path: `/tools/${slug}`, toolSlug: slug });
      logConversion({
        toolSlug: slug,
        fromFormat: "sign",
        toFormat: "pdf",
        fileName: file.name,
        fileSize: file.size,
        durationMs: Math.round(performance.now() - started),
        success: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign.");
    } finally {
      setBusy(false);
    }
  };

  if (!file) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <Dropzone
          accept="application/pdf,.pdf"
          multiple={false}
          onFiles={(f) => setFile(f[0])}
        />
      </div>
    );
  }

  const page = pages[pageIdx];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      {result ? (
        <DownloadList files={result} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm">
              <button
                type="button"
                disabled={pageIdx === 0}
                onClick={() => setPageIdx((p) => p - 1)}
                className="rounded border px-2 py-1 disabled:opacity-40"
              >
                ‹
              </button>
              <span className="text-slate-500">
                Page {pageIdx + 1} / {pages.length || "…"}
              </span>
              <button
                type="button"
                disabled={pageIdx >= pages.length - 1}
                onClick={() => setPageIdx((p) => p + 1)}
                className="rounded border px-2 py-1 disabled:opacity-40"
              >
                ›
              </button>
              <span className="ml-auto text-xs text-slate-400">
                Click the page to position the signature
              </span>
            </div>
            <div
              ref={frame}
              onClick={place}
              className="relative mx-auto max-w-full cursor-crosshair overflow-hidden rounded border border-slate-200 bg-slate-100 dark:border-slate-800"
            >
              {loading && (
                <div className="flex h-96 items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-sky-500" />
                </div>
              )}
              {page && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={page.dataUrl} alt="" className="w-full" />
                  {sig && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sig}
                      alt="signature preview"
                      className="pointer-events-none absolute"
                      style={{
                        left: `${pos.x * 100}%`,
                        top: `${pos.y * 100}%`,
                        width: `${widthPct * 100}%`,
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <SignaturePad onChange={setSig} />
            <div className="space-y-1.5">
              <Label>Signature size ({Math.round(widthPct * 100)}% of page)</Label>
              <input
                type="range"
                min={0.1}
                max={0.6}
                step={0.02}
                value={widthPct}
                onChange={(e) => setWidthPct(Number(e.target.value))}
                className="w-full accent-sky-600"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              className="w-full"
              size="lg"
              onClick={run}
              disabled={busy || !sig}
            >
              {busy ? <Loader2 className="animate-spin" /> : "Sign & download"}
            </Button>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600"
            >
              Choose another file
            </button>
          </div>
        </div>
      )}
      <p className="mt-3 text-center text-xs text-slate-400">
        This adds a visual signature image. It is not a cryptographic/digital
        signature.
      </p>
    </div>
  );
}
