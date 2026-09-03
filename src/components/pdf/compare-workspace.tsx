"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/dropzone";

type DiffPage = { page: number; a: string; b: string; diff: string; changed: number };

export function CompareWorkspace() {
  const [a, setA] = useState<File | null>(null);
  const [b, setB] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [pages, setPages] = useState<DiffPage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!a || !b) return;
    setBusy(true);
    setError(null);
    setPages(null);
    try {
      const { loadPdfDocument, renderPage } = await import("@/lib/pdf/render");
      const [da, db] = await Promise.all([
        loadPdfDocument(await a.arrayBuffer()),
        loadPdfDocument(await b.arrayBuffer()),
      ]);
      const count = Math.max(da.numPages, db.numPages);
      const out: DiffPage[] = [];
      for (let i = 1; i <= count; i++) {
        const ca =
          i <= da.numPages
            ? (await renderPage(await da.getPage(i), 1.2)).canvas
            : null;
        const cb =
          i <= db.numPages
            ? (await renderPage(await db.getPage(i), 1.2)).canvas
            : null;
        const w = Math.max(ca?.width ?? 0, cb?.width ?? 0);
        const h = Math.max(ca?.height ?? 0, cb?.height ?? 0);
        const diff = document.createElement("canvas");
        diff.width = w;
        diff.height = h;
        const dctx = diff.getContext("2d")!;
        const ia = imgData(ca, w, h);
        const ib = imgData(cb, w, h);
        const outData = dctx.createImageData(w, h);
        let changed = 0;
        for (let p = 0; p < outData.data.length; p += 4) {
          const dr = Math.abs((ia?.data[p] ?? 255) - (ib?.data[p] ?? 255));
          const dg = Math.abs((ia?.data[p + 1] ?? 255) - (ib?.data[p + 1] ?? 255));
          const dbb = Math.abs((ia?.data[p + 2] ?? 255) - (ib?.data[p + 2] ?? 255));
          const delta = dr + dg + dbb;
          if (delta > 60) {
            outData.data[p] = 239;
            outData.data[p + 1] = 68;
            outData.data[p + 2] = 68;
            outData.data[p + 3] = 255;
            changed++;
          } else {
            outData.data[p] = 255;
            outData.data[p + 1] = 255;
            outData.data[p + 2] = 255;
            outData.data[p + 3] = 255;
          }
        }
        dctx.putImageData(outData, 0, 0);
        out.push({
          page: i,
          a: ca?.toDataURL("image/jpeg", 0.7) ?? "",
          b: cb?.toDataURL("image/jpeg", 0.7) ?? "",
          diff: diff.toDataURL("image/png"),
          changed: Math.round((changed / (w * h)) * 1000) / 10,
        });
      }
      await Promise.all([da.cleanup(), db.cleanup()]);
      setPages(out);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      {!pages && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Original (A)</p>
            {a ? (
              <p className="truncate rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                {a.name}
              </p>
            ) : (
              <Dropzone
                accept="application/pdf,.pdf"
                multiple={false}
                onFiles={(f) => setA(f[0])}
                compact
              />
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Revised (B)</p>
            {b ? (
              <p className="truncate rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                {b.name}
              </p>
            ) : (
              <Dropzone
                accept="application/pdf,.pdf"
                multiple={false}
                onFiles={(f) => setB(f[0])}
                compact
              />
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {!pages ? (
        <Button
          className="mt-4"
          size="lg"
          onClick={run}
          disabled={busy || !a || !b}
        >
          {busy ? <Loader2 className="animate-spin" /> : "Compare"}
        </Button>
      ) : (
        <div className="space-y-6">
          <Button variant="outline" onClick={() => setPages(null)}>
            Compare different files
          </Button>
          {pages.map((p) => (
            <div key={p.page}>
              <p className="mb-2 text-sm font-medium">
                Page {p.page} —{" "}
                <span className={p.changed > 0 ? "text-red-600" : "text-emerald-600"}>
                  {p.changed}% of pixels differ
                </span>
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {(["a", "b", "diff"] as const).map((k) => (
                  <div key={k}>
                    <p className="mb-1 text-xs uppercase text-slate-400">
                      {k === "diff" ? "Differences" : k === "a" ? "A" : "B"}
                    </p>
                    {p[k] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p[k]}
                        alt=""
                        className="w-full rounded border border-slate-200 dark:border-slate-800"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded border border-dashed text-xs text-slate-400">
                        (no page)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function imgData(
  canvas: HTMLCanvasElement | null,
  w: number,
  h: number,
): ImageData | null {
  if (!canvas) return null;
  const scaled = document.createElement("canvas");
  scaled.width = w;
  scaled.height = h;
  const ctx = scaled.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(canvas, 0, 0);
  return ctx.getImageData(0, 0, w, h);
}
