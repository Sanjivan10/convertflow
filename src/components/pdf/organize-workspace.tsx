"use client";

import { useRef, useState } from "react";
import { Loader2, RotateCw, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/dropzone";
import { track, logConversion } from "@/lib/track";
import { organize } from "@/lib/pdf/ops";
import { usePdfPages } from "./use-pdf-pages";
import { DownloadList } from "./download-list";
import type { OpFile } from "@/lib/pdf/ops";

type PageState = { src: number; rotate: number; deleted: boolean };

export function OrganizeWorkspace({ slug }: { slug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const { pages, loading, error } = usePdfPages(file, 0.5);
  const [state, setState] = useState<PageState[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OpFile[] | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const dragFrom = useRef<number | null>(null);

  // Adjust state during render when a new set of pages arrives, rather than
  // in an effect — avoids an extra commit and the set-state-in-effect pitfall.
  const [seenPages, setSeenPages] = useState(pages);
  if (pages !== seenPages) {
    setSeenPages(pages);
    setState(pages.map((p) => ({ src: p.pageNumber - 1, rotate: 0, deleted: false })));
    setResult(null);
  }

  const move = (from: number, to: number) => {
    setState((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const rotate = (i: number) =>
    setState((p) =>
      p.map((s, idx) => (idx === i ? { ...s, rotate: s.rotate + 90 } : s)),
    );
  const toggleDelete = (i: number) =>
    setState((p) =>
      p.map((s, idx) => (idx === i ? { ...s, deleted: !s.deleted } : s)),
    );

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setRunError(null);
    const started = performance.now();
    try {
      const plan = state
        .filter((s) => !s.deleted)
        .map((s) => ({ src: s.src, rotate: s.rotate }));
      const res = await organize(file, plan);
      setResult(res.files);
      track({ type: "CONVERSION", path: `/tools/${slug}`, toolSlug: slug });
      logConversion({
        toolSlug: slug,
        fromFormat: "organize",
        toFormat: "pdf",
        fileName: file.name,
        fileSize: file.size,
        durationMs: Math.round(performance.now() - started),
        success: true,
      });
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Failed.");
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

  const kept = state.filter((s) => !s.deleted).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-slate-500">
          {loading ? "Rendering pages…" : `${kept} of ${state.length} pages kept`}
        </span>
        <button
          type="button"
          onClick={() => {
            setFile(null);
            setResult(null);
          }}
          className="text-slate-400 hover:text-slate-600"
        >
          Choose another file
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-sky-500" />
        </div>
      )}

      {!result && !loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {state.map((s, i) => {
            const preview = pages[s.src];
            return (
              <div
                key={`${s.src}-${i}`}
                draggable
                onDragStart={() => {
                  dragFrom.current = i;
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom.current !== null) move(dragFrom.current, i);
                  dragFrom.current = null;
                }}
                className={`group relative rounded-lg border bg-slate-50 p-1.5 dark:bg-slate-900 ${
                  s.deleted
                    ? "border-red-300 opacity-40"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                {preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview.dataUrl}
                    alt={`Page ${s.src + 1}`}
                    className="w-full rounded bg-white transition-transform"
                    style={{ transform: `rotate(${s.rotate}deg)` }}
                  />
                )}
                <div className="mt-1 flex items-center justify-between px-1 text-[11px] text-slate-400">
                  <span>#{i + 1}</span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => rotate(i)}
                      className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700"
                      aria-label="Rotate page"
                    >
                      <RotateCw className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleDelete(i)}
                      className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700"
                      aria-label="Delete page"
                    >
                      {s.deleted ? (
                        <Undo2 className="size-3.5" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {runError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50">
          {runError}
        </p>
      )}

      {result && (
        <div className="mt-4">
          <DownloadList files={result} />
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {!result && (
          <Button size="lg" onClick={run} disabled={busy || kept === 0}>
            {busy ? <Loader2 className="animate-spin" /> : "Apply & download"}
          </Button>
        )}
        {result && (
          <Button variant="outline" size="lg" onClick={() => setResult(null)}>
            Back to editing
          </Button>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">
        Drag thumbnails to reorder. Everything runs in your browser.
      </p>
    </div>
  );
}
