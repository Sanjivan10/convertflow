"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ImageIcon, Loader2, RotateCcw } from "lucide-react";
import { Dropzone } from "@/components/dropzone";
import { logConversion, trackClick } from "@/lib/track";
import { cn } from "@/lib/utils";
import { contentBox, detectBackground, removeBackground } from "@/lib/logos/process";

type Mode = "photo" | "color";
type Bg = "transparent" | "white" | "black" | "color" | "blur";
type Format = "png" | "webp" | "jpg";

/**
 * AI background removal with U²-Net-P (Apache-2.0, 4.5 MB, self-hosted in
 * /public/models). Runs on onnxruntime-web's CPU (WebAssembly) backend, which
 * works on every modern browser — no GPU needed. The runtime is loaded from
 * the CDN at a pinned version only when the tool is used.
 */
const ORT_BASE = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/";
const MODEL_URL = "/models/u2netp.onnx";
const NET = 320;

const MAX_SIDE = 4096;
const CHECKER = "repeating-conic-gradient(#e2e8f0 0 25%, #ffffff 0 50%) 0 0 / 18px 18px";
const MIME: Record<Format, string> = { png: "image/png", webp: "image/webp", jpg: "image/jpeg" };

/* eslint-disable @typescript-eslint/no-explicit-any */
let sessionPromise: Promise<{ ort: any; session: any }> | null = null;
/* eslint-enable @typescript-eslint/no-explicit-any */

function loadSession(onProgress: (p: number) => void) {
  sessionPromise ??= (async () => {
    // new Function keeps the bundler from trying to resolve the CDN URL.
    const ort = await (new Function("u", "return import(u)") as (u: string) => Promise<any>)( // eslint-disable-line @typescript-eslint/no-explicit-any
      ORT_BASE + "ort.wasm.min.mjs",
    );
    ort.env.wasm.wasmPaths = ORT_BASE;
    const res = await fetch(MODEL_URL);
    if (!res.ok || !res.body) throw new Error("model download failed");
    const total = Number(res.headers.get("content-length")) || 4_574_861;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      got += value.length;
      onProgress(Math.min(1, got / total));
    }
    const bytes = new Uint8Array(got);
    let o = 0;
    for (const c of chunks) {
      bytes.set(c, o);
      o += c.length;
    }
    const session = await ort.InferenceSession.create(bytes, { executionProviders: ["wasm"] });
    return { ort, session };
  })();
  sessionPromise.catch(() => (sessionPromise = null));
  return sessionPromise;
}

async function fileToCanvas(file: File) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c;
}

/** Returns a single-channel alpha mask (0–255) the size of the source canvas. */
async function aiMask(src: HTMLCanvasElement, onProgress: (p: number) => void) {
  const { ort, session } = await loadSession(onProgress);
  // Pre-process exactly like rembg: resize to 320², scale by max, ImageNet mean/std, NCHW.
  const small = document.createElement("canvas");
  small.width = NET;
  small.height = NET;
  const sctx = small.getContext("2d", { willReadFrequently: true })!;
  sctx.drawImage(src, 0, 0, NET, NET);
  const px = sctx.getImageData(0, 0, NET, NET).data;
  let max = 1;
  for (let i = 0; i < px.length; i += 4) max = Math.max(max, px[i], px[i + 1], px[i + 2]);
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  const n = NET * NET;
  const input = new Float32Array(3 * n);
  for (let p = 0; p < n; p++) for (let k = 0; k < 3; k++) input[k * n + p] = (px[p * 4 + k] / max - mean[k]) / std[k];

  const out = await session.run({ [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, NET, NET]) });
  const pred = out[session.outputNames[0]].data as Float32Array;
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of pred) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const range = hi - lo || 1;

  // Low-res mask → full size with smooth (bilinear) scaling.
  const m = sctx.createImageData(NET, NET);
  for (let p = 0; p < n; p++) m.data[p * 4 + 3] = Math.round((255 * (pred[p] - lo)) / range);
  sctx.clearRect(0, 0, NET, NET);
  sctx.putImageData(m, 0, 0);
  const big = document.createElement("canvas");
  big.width = src.width;
  big.height = src.height;
  const bctx = big.getContext("2d", { willReadFrequently: true })!;
  bctx.imageSmoothingQuality = "high";
  bctx.drawImage(small, 0, 0, src.width, src.height);
  const full = bctx.getImageData(0, 0, src.width, src.height).data;
  const mask = new Uint8ClampedArray(src.width * src.height);
  for (let i = 0; i < mask.length; i++) mask[i] = full[i * 4 + 3];
  return mask;
}

export function BackgroundRemover({ slug }: { slug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>("photo");
  const [status, setStatus] = useState<string>("");
  const [dl, setDl] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [bg, setBg] = useState<Bg>("transparent");
  const [bgColor, setBgColor] = useState("#0ea5e9");
  const [crop, setCrop] = useState(false);
  const [format, setFormat] = useState<Format>("png");
  const [showOriginal, setShowOriginal] = useState(false);
  const [ready, setReady] = useState(0);

  const srcRef = useRef<HTMLCanvasElement | null>(null);
  const cutRef = useRef<HTMLCanvasElement | null>(null); // subject with alpha
  const viewRef = useRef<HTMLCanvasElement>(null);

  const run = useCallback(async (f: File, m: Mode) => {
    setError("");
    setDl(null);
    cutRef.current = null;
    setReady((n) => n + 1);
    const t0 = performance.now();
    try {
      setStatus("Opening photo…");
      const src = srcRef.current && srcRef.current.dataset.name === f.name + f.size ? srcRef.current : await fileToCanvas(f);
      src.dataset.name = f.name + f.size;
      srcRef.current = src;
      const ctx = src.getContext("2d", { willReadFrequently: true })!;
      const data = ctx.getImageData(0, 0, src.width, src.height);

      if (m === "color") {
        removeBackground(data, "color", detectBackground(data), 18);
      } else {
        setStatus(sessionPromise ? "Removing background…" : "Loading AI model (4.5 MB, one time)…");
        const mask = await aiMask(src, (p) => setDl(p));
        setDl(null);
        setStatus("Removing background…");
        for (let i = 0, p = 3; i < mask.length; i++, p += 4) data.data[p] = Math.min(data.data[p], mask[i]);
      }

      const cut = document.createElement("canvas");
      cut.width = src.width;
      cut.height = src.height;
      cut.getContext("2d")!.putImageData(data, 0, 0);
      cutRef.current = cut;
      setStatus("");
      setReady((n) => n + 1);
      logConversion({
        toolSlug: slug,
        fromFormat: (f.name.split(".").pop() || "img").toUpperCase(),
        toFormat: "PNG",
        fileName: f.name,
        fileSize: f.size,
        durationMs: Math.round(performance.now() - t0),
        success: true,
      });
    } catch (e) {
      setStatus("");
      setDl(null);
      setError(
        m === "color"
          ? "Couldn't open this image. Try a JPG, PNG or WebP."
          : "The AI couldn't run here. Check your connection and try again, or use “Plain color” for logos and graphics.",
      );
      logConversion({
        toolSlug: slug,
        fromFormat: (f.name.split(".").pop() || "img").toUpperCase(),
        toFormat: "PNG",
        success: false,
        error: e instanceof Error ? e.message.slice(0, 200) : "error",
      });
    }
  }, [slug]);

  function pick(f: File) {
    srcRef.current = null;
    setFile(f);
    setShowOriginal(false);
    void run(f, mode);
  }

  function changeMode(m: Mode) {
    setMode(m);
    if (file) void run(file, m);
  }

  /** Compose subject + chosen background at full resolution. */
  const compose = useCallback((): HTMLCanvasElement | null => {
    const cut = cutRef.current;
    const src = srcRef.current;
    if (!cut || !src) return null;
    let box = { x: 0, y: 0, w: cut.width, h: cut.height };
    if (crop) {
      const b = contentBox(cut.getContext("2d")!.getImageData(0, 0, cut.width, cut.height));
      if (b) box = b;
    }
    const out = document.createElement("canvas");
    out.width = box.w;
    out.height = box.h;
    const ctx = out.getContext("2d")!;
    const effective: Bg = format === "jpg" && bg === "transparent" ? "white" : bg;
    if (effective === "blur") {
      const r = Math.max(6, Math.round(Math.max(src.width, src.height) / 80));
      ctx.filter = `blur(${r}px)`;
      // Overdraw past the edges so the blur doesn't fade to transparent at the border.
      ctx.drawImage(src, box.x, box.y, box.w, box.h, -r * 2, -r * 2, box.w + r * 4, box.h + r * 4);
      ctx.filter = "none";
    } else if (effective !== "transparent") {
      ctx.fillStyle = effective === "white" ? "#ffffff" : effective === "black" ? "#000000" : bgColor;
      ctx.fillRect(0, 0, box.w, box.h);
    }
    ctx.drawImage(cut, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
    return out;
  }, [bg, bgColor, crop, format]);

  // Preview
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const c = showOriginal ? srcRef.current : compose();
    if (!c) return;
    const scale = Math.min(1, 1000 / Math.max(c.width, c.height));
    view.width = Math.round(c.width * scale);
    view.height = Math.round(c.height * scale);
    view.getContext("2d")!.drawImage(c, 0, 0, view.width, view.height);
  }, [ready, compose, showOriginal]);

  async function download() {
    const c = compose();
    if (!c || !file) return;
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, MIME[format], 0.95));
    if (!blob) return setError("Your browser couldn't create the file.");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.replace(/\.[^.]+$/, "") || "image"}-no-bg.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    trackClick(`bg-remove:${slug}`, { mode, bg, format });
  }

  const chip = (active: boolean) =>
    cn(
      "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
      active
        ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
        : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300",
    );
  const label = "text-xs font-medium uppercase tracking-wide text-slate-500";
  const working = Boolean(status);
  const done = Boolean(cutRef.current) && !working;

  const modes: { id: Mode; title: string; hint: string }[] = [
    { id: "photo", title: "Photo (AI)", hint: "People, products, pets, cars" },
    { id: "color", title: "Plain color", hint: "Logos & graphics on white" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950">
      <p className={label}>What’s in your photo?</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={working}
            onClick={() => changeMode(m.id)}
            className={cn(chip(mode === m.id), "text-left disabled:opacity-60")}
          >
            <span className="block">{m.title}</span>
            <span className="block text-xs font-normal text-slate-500">{m.hint}</span>
          </button>
        ))}
      </div>

      {!file ? (
        <div className="mt-4">
          <Dropzone accept="image/png,image/jpeg,image/webp,image/bmp,image/gif" multiple={false} onFiles={(f) => f[0] && pick(f[0])} />
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <span className="flex min-w-0 items-center gap-2 text-sm">
              <ImageIcon className="size-4 shrink-0 text-sky-600" />
              <span className="truncate font-medium">{file.name}</span>
            </span>
            <button
              type="button"
              disabled={working}
              onClick={() => {
                setFile(null);
                cutRef.current = null;
                srcRef.current = null;
              }}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-slate-500 hover:text-sky-600 disabled:opacity-50"
            >
              <RotateCcw className="size-4" /> New photo
            </button>
          </div>

          <div
            className="relative mt-4 flex min-h-56 items-center justify-center overflow-hidden rounded-xl border border-slate-200 p-3 dark:border-slate-800"
            style={{ background: CHECKER }}
          >
            <canvas
              ref={viewRef}
              className={cn("h-auto max-h-[420px] w-auto max-w-full", !done && !showOriginal && "opacity-0")}
              aria-label="Background removed preview"
            />
            {working && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 p-6 text-center text-sm dark:bg-slate-950/80">
                <Loader2 className="size-6 animate-spin text-sky-600" />
                <span className="font-medium">{status}</span>
                {dl !== null && (
                  <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full bg-sky-600" style={{ width: `${Math.round(dl * 100)}%` }} />
                  </div>
                )}
              </div>
            )}
          </div>

          {done && (
            <>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowOriginal((v) => !v)}
                  className="text-xs font-medium text-sky-600 hover:underline"
                >
                  {showOriginal ? "Show result" : "Compare with original"}
                </button>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <fieldset>
                  <legend className={label}>New background</legend>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {(["transparent", "white", "black", "color", "blur"] as Bg[]).map((b) => (
                      <button
                        key={b}
                        type="button"
                        className={chip(bg === b)}
                        onClick={() => setBg(b)}
                        disabled={format === "jpg" && b === "transparent"}
                      >
                        {b === "transparent" ? "Transparent" : b[0].toUpperCase() + b.slice(1)}
                      </button>
                    ))}
                    {bg === "color" && (
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        aria-label="Background color"
                        className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-transparent"
                      />
                    )}
                  </div>
                  <label className="mt-3 flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={crop} onChange={(e) => setCrop(e.target.checked)} className="accent-sky-600" />
                    Crop to subject
                  </label>
                </fieldset>
                <fieldset>
                  <legend className={label}>Format</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["png", "webp", "jpg"] as Format[]).map((f) => (
                      <button key={f} type="button" className={chip(format === f)} onClick={() => setFormat(f)}>
                        {f === "png" ? "PNG (transparent)" : f === "webp" ? "WebP" : "JPG"}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <button
                type="button"
                onClick={download}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 sm:w-auto"
              >
                <Download className="size-5" /> Download {format.toUpperCase()}
              </button>
            </>
          )}
        </>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <p className="mt-4 text-xs text-slate-400">
        AI model: U²-Net (Apache-2.0), running locally in your browser.
      </p>
    </div>
  );
}
