"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2, Square, Trash2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/dropzone";
import { track, logConversion } from "@/lib/track";
import { burnPages, type OpFile } from "@/lib/pdf/ops";
import { usePdfPages } from "./use-pdf-pages";
import { DownloadList } from "./download-list";

type Anno = {
  page: number; // 0-based
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "box" | "text";
  color: string;
  text?: string;
};

export function AnnotateWorkspace({
  slug,
  mode,
}: {
  slug: string;
  mode: "redact" | "editor";
}) {
  const [file, setFile] = useState<File | null>(null);
  const { pages, loading } = usePdfPages(file, 1);
  const [pageIdx, setPageIdx] = useState(0);
  const [tool, setTool] = useState<"box" | "text">("box");
  const [color, setColor] = useState(mode === "redact" ? "#000000" : "#2563eb");
  const [annos, setAnnos] = useState<Anno[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OpFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<Anno | null>(null);

  const rel = (e: React.MouseEvent) => {
    const r = surface.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const onDown = (e: React.MouseEvent) => {
    if (mode === "redact") setTool("box");
    start.current = rel(e);
  };
  const onMove = (e: React.MouseEvent) => {
    if (!start.current) return;
    const p = rel(e);
    setDraft({
      page: pageIdx,
      x: Math.min(start.current.x, p.x),
      y: Math.min(start.current.y, p.y),
      w: Math.abs(p.x - start.current.x),
      h: Math.abs(p.y - start.current.y),
      kind: tool,
      color,
    });
  };
  const onUp = () => {
    if (draft && draft.w > 0.01 && draft.h > 0.01) {
      if (draft.kind === "text") {
        const text = window.prompt("Text to add") ?? "";
        if (text) setAnnos((a) => [...a, { ...draft, text }]);
      } else {
        setAnnos((a) => [...a, draft]);
      }
    }
    start.current = null;
    setDraft(null);
  };

  const pageAnnos = useMemo(
    () => annos.filter((a) => a.page === pageIdx),
    [annos, pageIdx],
  );

  const run = async () => {
    if (!file || annos.length === 0) return;
    setBusy(true);
    setError(null);
    const started = performance.now();
    try {
      const { loadPdfDocument, renderPage, canvasToBlob } = await import(
        "@/lib/pdf/render"
      );
      const doc = await loadPdfDocument(await file.arrayBuffer());
      const rasters = new Map<number, Blob>();
      const affected = [...new Set(annos.map((a) => a.page))];
      for (const idx of affected) {
        const page = await doc.getPage(idx + 1);
        const { canvas } = await renderPage(page, 2);
        const ctx = canvas.getContext("2d")!;
        for (const a of annos.filter((x) => x.page === idx)) {
          const x = a.x * canvas.width;
          const y = a.y * canvas.height;
          const w = a.w * canvas.width;
          const h = a.h * canvas.height;
          if (a.kind === "box") {
            ctx.fillStyle = a.color;
            ctx.fillRect(x, y, w, h);
          } else {
            ctx.fillStyle = a.color;
            ctx.font = `${Math.max(12, h)}px sans-serif`;
            ctx.textBaseline = "top";
            ctx.fillText(a.text ?? "", x, y);
          }
        }
        rasters.set(idx, await canvasToBlob(canvas, "image/png", 1));
        page.cleanup();
      }
      await doc.cleanup();
      const res = await burnPages(file, rasters);
      const named = res.files.map((f) => ({
        ...f,
        name: f.name.replace("-edited", mode === "redact" ? "-redacted" : "-edited"),
      }));
      setResult(named);
      track({ type: "CONVERSION", path: `/tools/${slug}`, toolSlug: slug });
      logConversion({
        toolSlug: slug,
        fromFormat: mode,
        toFormat: "pdf",
        fileName: file.name,
        fileSize: file.size,
        durationMs: Math.round(performance.now() - started),
        success: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
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
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
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

            {mode === "editor" && (
              <span className="ml-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => setTool("box")}
                  className={`rounded p-1.5 ${tool === "box" ? "bg-sky-100 text-sky-700" : "text-slate-500"}`}
                  aria-label="Rectangle"
                >
                  <Square className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setTool("text")}
                  className={`rounded p-1.5 ${tool === "text" ? "bg-sky-100 text-sky-700" : "text-slate-500"}`}
                  aria-label="Text"
                >
                  <Type className="size-4" />
                </button>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-8 rounded border"
                />
              </span>
            )}
            {pageAnnos.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setAnnos((a) => a.filter((x) => x.page !== pageIdx))
                }
                className="ml-auto inline-flex items-center gap-1 text-xs text-red-500"
              >
                <Trash2 className="size-3.5" /> Clear page
              </button>
            )}
          </div>

          <div
            ref={surface}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            className="relative mx-auto max-w-full cursor-crosshair select-none overflow-hidden rounded border border-slate-200 bg-slate-100 dark:border-slate-800"
          >
            {loading && (
              <div className="flex h-96 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-sky-500" />
              </div>
            )}
            {page && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={page.dataUrl} alt="" className="w-full" draggable={false} />
            )}
            {[...pageAnnos, ...(draft ? [draft] : [])].map((a, i) => (
              <div
                key={i}
                className="absolute border"
                style={{
                  left: `${a.x * 100}%`,
                  top: `${a.y * 100}%`,
                  width: `${a.w * 100}%`,
                  height: `${a.h * 100}%`,
                  background: a.kind === "box" ? a.color : "transparent",
                  borderColor: a.color,
                  color: a.color,
                  fontSize: 12,
                }}
              >
                {a.kind === "text" ? a.text : null}
              </div>
            ))}
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="lg"
              onClick={run}
              disabled={busy || annos.length === 0}
            >
              {busy ? (
                <Loader2 className="animate-spin" />
              ) : mode === "redact" ? (
                "Apply redactions & download"
              ) : (
                "Flatten & download"
              )}
            </Button>
            <Button variant="outline" size="lg" onClick={() => setFile(null)}>
              Choose another file
            </Button>
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            {mode === "redact"
              ? "Redacted pages are rasterised — text under the black boxes is permanently removed."
              : "Edited pages are flattened to an image on export."}
          </p>
        </>
      )}
    </div>
  );
}
