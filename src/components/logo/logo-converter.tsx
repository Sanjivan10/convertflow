"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ImageIcon, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Dropzone } from "@/components/dropzone";
import { logConversion, trackClick } from "@/lib/track";
import { cn } from "@/lib/utils";
import {
  WORK_MAX,
  compose,
  contentBox,
  detectBackground,
  hasTransparentEdges,
  hexToRgb,
  recolor,
  removeBackground,
  rgbToHex,
  type BgMode,
  type Recolor,
  type Shape,
} from "@/lib/logos/process";

type Format = "png" | "webp" | "jpg";
type PreviewBg = "checker" | "light" | "dark";

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/bmp,.svg";
const SIZES = [512, 1024, 2048, 4096];
const MIME: Record<Format, string> = { png: "image/png", webp: "image/webp", jpg: "image/jpeg" };
const CHECKER = "repeating-conic-gradient(#e2e8f0 0 25%, #ffffff 0 50%) 0 0 / 18px 18px";

type Source = {
  name: string;
  canvas: HTMLCanvasElement;
  data: ImageData;
  transparent: boolean;
  bg: string;
  type: string;
};

/** Reads an uploaded file (raster or SVG) into a canvas at a workable size. */
async function loadSource(file: File): Promise<Source> {
  let img: CanvasImageSource;
  let w: number;
  let h: number;
  let revoke: string | null = null;

  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    let text = await file.text();
    const vb = text.match(/viewBox="([\d.\s,-]+)"/);
    const parts = vb?.[1].split(/[\s,]+/).map(Number);
    const vw = parts?.[2] || 1000;
    const vh = parts?.[3] || 1000;
    w = 2000;
    h = Math.round((2000 * vh) / vw);
    text = text.replace(/<svg\b([^>]*?)\swidth="[^"]*"/, "<svg$1").replace(/<svg\b([^>]*?)\sheight="[^"]*"/, "<svg$1");
    text = text.replace(/<svg\b/, `<svg width="${w}" height="${h}"`);
    revoke = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }));
    const el = new Image();
    el.src = revoke;
    await el.decode();
    img = el;
  } else {
    const bmp = await createImageBitmap(file);
    img = bmp;
    w = bmp.width;
    h = bmp.height;
  }

  const scale = Math.min(1, WORK_MAX / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  if (revoke) URL.revokeObjectURL(revoke);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return {
    name: file.name.replace(/\.[^.]+$/, "") || "logo",
    canvas,
    data,
    transparent: hasTransparentEdges(data),
    bg: rgbToHex(detectBackground(data)),
    type: (file.name.split(".").pop() || "png").toUpperCase(),
  };
}

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
      <span className="flex size-6 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
        {n}
      </span>
      {children}
    </h3>
  );
}

export function LogoConverter({ slug, sampleUrl }: { slug: string; sampleUrl: string }) {
  const [src, setSrc] = useState<Source | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [bgMode, setBgMode] = useState<BgMode>("color");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [tolerance, setTolerance] = useState(18);
  const [trim, setTrim] = useState(true);
  const [color, setColor] = useState<Recolor>("original");
  const [customColor, setCustomColor] = useState("#66f9a8");
  const [shape, setShape] = useState<Shape>("none");
  const [shapeColor, setShapeColor] = useState("#1d2238");
  const [padding, setPadding] = useState(4);
  const [width, setWidth] = useState(2048);
  const [format, setFormat] = useState<Format>("png");
  const [jpgBg, setJpgBg] = useState("#ffffff");
  const [previewBg, setPreviewBg] = useState<PreviewBg>("checker");
  const [busy, setBusy] = useState(false);

  const processed = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [version, setVersion] = useState(0);

  const open = useCallback(async (file: File) => {
    setLoading(true);
    setError("");
    try {
      const s = await loadSource(file);
      setSrc(s);
      setBgColor(s.bg);
      setBgMode(s.transparent ? "none" : "color");
    } catch {
      setError("Couldn't open that file. Try a PNG, JPG, WebP or SVG logo.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function trySample() {
    setLoading(true);
    try {
      const res = await fetch(sampleUrl);
      const blob = await res.blob();
      await open(new File([blob], "alight-motion-logo-sample.jpg", { type: blob.type }));
      trackClick(`logo-sample:${slug}`);
    } catch {
      setError("Couldn't load the sample. Please upload your own logo.");
      setLoading(false);
    }
  }

  // Background removal + recolor + trim → processed canvas.
  useEffect(() => {
    if (!src) return;
    const id = requestAnimationFrame(() => {
      const data = new ImageData(new Uint8ClampedArray(src.data.data), src.data.width, src.data.height);
      if (bgMode !== "none") removeBackground(data, bgMode, hexToRgb(bgColor), tolerance);
      if (color !== "original") {
        recolor(data, hexToRgb(color === "white" ? "#ffffff" : color === "black" ? "#000000" : customColor));
      }
      const box = trim ? contentBox(data) : null;
      const full = document.createElement("canvas");
      full.width = data.width;
      full.height = data.height;
      full.getContext("2d")!.putImageData(data, 0, 0);
      let out = full;
      if (box) {
        out = document.createElement("canvas");
        out.width = box.w;
        out.height = box.h;
        out.getContext("2d")!.drawImage(full, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      }
      processed.current = out;
      setVersion((v) => v + 1);
    });
    return () => cancelAnimationFrame(id);
  }, [src, bgMode, bgColor, tolerance, color, customColor, trim]);

  const background = format === "jpg" ? jpgBg : null;
  const opts = { paddingPct: padding, shape, shapeColor, background };

  // Live preview (small, fast).
  useEffect(() => {
    const logo = processed.current;
    const view = previewRef.current;
    if (!logo || !view) return;
    const c = compose(logo, { ...opts, width: 900 });
    view.width = c.width;
    view.height = c.height;
    view.getContext("2d")!.drawImage(c, 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, padding, shape, shapeColor, background]);

  function pickColor(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!src) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * src.data.width);
    const y = Math.floor(((e.clientY - r.top) / r.height) * src.data.height);
    const i = (y * src.data.width + x) * 4;
    const d = src.data.data;
    setBgColor(rgbToHex([d[i], d[i + 1], d[i + 2]]));
    if (bgMode === "none") setBgMode("color");
  }

  const originalRef = useCallback(
    (el: HTMLCanvasElement | null) => {
      if (!el || !src) return;
      el.width = src.canvas.width;
      el.height = src.canvas.height;
      el.getContext("2d")!.drawImage(src.canvas, 0, 0);
    },
    [src],
  );

  async function download() {
    const logo = processed.current;
    if (!logo || !src) return;
    setBusy(true);
    const t0 = performance.now();
    try {
      const c = compose(logo, { ...opts, width });
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, MIME[format], 0.95));
      if (!blob) throw new Error("export failed");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${src.name}-motion-logo.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      logConversion({
        toolSlug: slug,
        fromFormat: src.type,
        toFormat: format.toUpperCase(),
        fileName: src.name,
        fileSize: blob.size,
        durationMs: Math.round(performance.now() - t0),
        success: true,
      });
      trackClick(`logo-convert:${slug}`, { format, width, bgMode, shape, color });
    } catch {
      setError("Your browser couldn't create that file. Try a smaller size.");
    } finally {
      setBusy(false);
    }
  }

  const chip = (active: boolean) =>
    cn(
      "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
      active
        ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
        : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300",
    );
  const label = "text-xs font-medium uppercase tracking-wide text-slate-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950">
      {/* Step 1 */}
      <StepTitle n={1}>Upload your logo</StepTitle>
      {!src ? (
        <div className="mt-3">
          <Dropzone accept={ACCEPT} multiple={false} compact onFiles={(f) => f[0] && open(f[0])} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-slate-500">PNG, JPG, WebP, SVG, GIF or BMP</span>
            <button
              type="button"
              onClick={trySample}
              className="inline-flex items-center gap-1.5 font-medium text-sky-600 hover:underline"
            >
              <Sparkles className="size-4" /> Try with the Alight Motion logo
            </button>
          </div>
          {loading && (
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" /> Opening your logo…
            </p>
          )}
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <ImageIcon className="size-4 shrink-0 text-sky-600" />
            <span className="truncate font-medium">{src.name}</span>
            <span className="shrink-0 text-slate-400">
              {src.type} · {src.data.width}×{src.data.height}
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              setSrc(null);
              processed.current = null;
            }}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-slate-500 hover:text-sky-600"
          >
            <RotateCcw className="size-4" /> New logo
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {src && (
        <>
          {/* Preview */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className={label}>Preview</p>
              <div className="flex gap-1">
                {(["checker", "light", "dark"] as PreviewBg[]).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setPreviewBg(b)}
                    className={cn(chip(previewBg === b), "px-2 py-1 text-xs")}
                  >
                    {b === "checker" ? "Transparent" : b === "light" ? "Light" : "Dark"}
                  </button>
                ))}
              </div>
            </div>
            <div
              className="mt-2 flex min-h-48 items-center justify-center rounded-xl border border-slate-200 p-4 dark:border-slate-800"
              style={{
                background: previewBg === "checker" ? CHECKER : previewBg === "light" ? "#ffffff" : "#0f172a",
              }}
            >
              <canvas ref={previewRef} className="h-auto max-h-80 w-auto max-w-full" aria-label="Converted logo preview" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="mt-6">
            <StepTitle n={2}>Remove the background</StepTitle>
            {src.transparent && (
              <p className="mt-2 text-sm text-emerald-600">
                Your logo already has a transparent background — nothing to remove.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={chip(bgMode === "color")} onClick={() => setBgMode("color")}>
                Remove background (recommended)
              </button>
              <button type="button" className={chip(bgMode === "auto")} onClick={() => setBgMode("auto")}>
                Keep white inside logo
              </button>
              <button type="button" className={chip(bgMode === "none")} onClick={() => setBgMode("none")}>
                Keep background
              </button>
            </div>
            {bgMode !== "none" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-[160px_1fr]">
                <div>
                  <p className={label}>Background color</p>
                  <canvas
                    ref={originalRef}
                    onClick={pickColor}
                    className="mt-2 h-auto max-h-28 w-full cursor-crosshair rounded-lg border border-slate-200 object-contain dark:border-slate-700"
                    title="Tap the background to pick its color"
                    style={{ background: CHECKER }}
                  />
                  <p className="mt-1 text-xs text-slate-500">Tap the background above to pick it</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      aria-label="Background color to remove"
                      className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-transparent"
                    />
                    <span className="font-mono text-sm">{bgColor.toUpperCase()}</span>
                  </div>
                  <label className="block">
                    <span className={label}>Strength: {tolerance}</span>
                    <input
                      type="range"
                      min={2}
                      max={60}
                      value={tolerance}
                      onChange={(e) => setTolerance(Number(e.target.value))}
                      className="mt-2 w-full accent-sky-600"
                    />
                    <span className="text-xs text-slate-500">
                      Raise it if bits of background remain; lower it if parts of the logo disappear.
                    </span>
                  </label>
                </div>
              </div>
            )}
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={trim} onChange={(e) => setTrim(e.target.checked)} className="accent-sky-600" />
              Trim empty space around the logo
            </label>
          </div>

          {/* Step 3 */}
          <div className="mt-6">
            <StepTitle n={3}>Style it for motion videos</StepTitle>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <fieldset>
                <legend className={label}>Logo color</legend>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(["original", "white", "black", "custom"] as Recolor[]).map((c) => (
                    <button key={c} type="button" className={chip(color === c)} onClick={() => setColor(c)}>
                      {c[0].toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                  {color === "custom" && (
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      aria-label="Custom logo color"
                      className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-transparent"
                    />
                  )}
                </div>
              </fieldset>
              <fieldset>
                <legend className={label}>Badge shape</legend>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(["none", "circle", "rounded"] as Shape[]).map((s) => (
                    <button key={s} type="button" className={chip(shape === s)} onClick={() => setShape(s)}>
                      {s === "none" ? "None" : s === "circle" ? "Circle" : "Rounded square"}
                    </button>
                  ))}
                  {shape !== "none" && (
                    <input
                      type="color"
                      value={shapeColor}
                      onChange={(e) => setShapeColor(e.target.value)}
                      aria-label="Badge color"
                      className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-transparent"
                    />
                  )}
                </div>
              </fieldset>
              <label className="block sm:col-span-2">
                <span className={label}>Padding: {padding}%</span>
                <input
                  type="range"
                  min={0}
                  max={25}
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                  className="mt-2 w-full accent-sky-600"
                />
              </label>
            </div>
          </div>

          {/* Step 4 */}
          <div className="mt-6">
            <StepTitle n={4}>Choose size &amp; download</StepTitle>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <fieldset>
                <legend className={label}>Format</legend>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(["png", "webp", "jpg"] as Format[]).map((f) => (
                    <button key={f} type="button" className={chip(format === f)} onClick={() => setFormat(f)}>
                      {f === "png" ? "PNG (transparent)" : f === "webp" ? "WebP (transparent)" : "JPG"}
                    </button>
                  ))}
                  {format === "jpg" && (
                    <input
                      type="color"
                      value={jpgBg}
                      onChange={(e) => setJpgBg(e.target.value)}
                      aria-label="JPG background color"
                      className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-transparent"
                    />
                  )}
                </div>
              </fieldset>
              <fieldset>
                <legend className={label}>Width (px)</legend>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {SIZES.map((s) => (
                    <button key={s} type="button" className={chip(width === s)} onClick={() => setWidth(s)}>
                      {s === 4096 ? "4K" : s}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={64}
                    max={6000}
                    value={width}
                    onChange={(e) => {
                      const n = Math.round(Number(e.target.value));
                      if (Number.isFinite(n)) setWidth(Math.min(6000, Math.max(64, n)));
                    }}
                    aria-label="Custom width in pixels"
                    className="h-9 w-24 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              </fieldset>
            </div>
            <button
              type="button"
              onClick={download}
              disabled={busy}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-60 sm:w-auto"
            >
              {busy ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />}
              Download motion logo {format.toUpperCase()}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
