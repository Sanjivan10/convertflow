"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, Loader2 } from "lucide-react";
import type { BrandColor, LogoVariant } from "@/lib/logos/catalog";
import { trackClick } from "@/lib/track";
import { cn } from "@/lib/utils";

type Format = "png" | "jpg" | "webp" | "svg";
type Bg = "transparent" | "white" | "black" | "custom";

const SIZES = [512, 1024, 2048, 4096];
const MAX = 6000;
const MIME: Record<Exclude<Format, "svg">, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};
const CHECKER =
  "repeating-conic-gradient(#e2e8f0 0 25%, #ffffff 0 50%) 0 0 / 20px 20px";

function bgColor(bg: Bg, custom: string): string | null {
  if (bg === "white") return "#ffffff";
  if (bg === "black") return "#000000";
  if (bg === "custom") return custom;
  return null;
}

/** Output geometry: `width` is the full image width, padding included. */
function layout(v: LogoVariant, width: number, paddingPct: number) {
  const pad = Math.round((width * paddingPct) / 100);
  const innerW = Math.max(1, width - pad * 2);
  const innerH = Math.max(1, Math.round((innerW * v.height) / v.width));
  return { pad, innerW, innerH, width, height: innerH + pad * 2 };
}

/** Give the SVG root an explicit pixel size (Safari needs it to rasterize). */
function sizedSvg(svg: string, w: number, h: number, extra = "") {
  return svg.replace(/<svg\b/, `<svg width="${w}" height="${h}" ${extra}`);
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function LogoStudio({
  slug,
  brand,
  fileBase,
  variants,
  colors,
}: {
  slug: string;
  brand: string;
  /** Download file name prefix, e.g. "alight-motion-logo". */
  fileBase: string;
  variants: LogoVariant[];
  colors: BrandColor[];
}) {
  const [variantId, setVariantId] = useState(variants[0].id);
  const [format, setFormat] = useState<Format>("png");
  const [width, setWidth] = useState(2048);
  const [bg, setBg] = useState<Bg>("transparent");
  const [custom, setCustom] = useState("#1d2238");
  const [padding, setPadding] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const v = variants.find((x) => x.id === variantId) ?? variants[0];
  // JPG can't be transparent — fall back to white.
  const effectiveBg: Bg = format === "jpg" && bg === "transparent" ? "white" : bg;
  const fill = bgColor(effectiveBg, custom);
  const geo = useMemo(() => layout(v, width, padding), [v, width, padding]);

  async function download() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${v.file}.svg`);
      if (!res.ok) throw new Error("Could not load the logo file.");
      const source = await res.text();
      const name = `${fileBase}-${v.id}-${geo.width}x${geo.height}.${format}`;

      if (format === "svg") {
        const inner = sizedSvg(
          source.replace(/<\?xml[^>]*>/, ""),
          geo.innerW,
          geo.innerH,
          `x="${geo.pad}" y="${geo.pad}"`,
        );
        const out =
          `<svg xmlns="http://www.w3.org/2000/svg" width="${geo.width}" height="${geo.height}" viewBox="0 0 ${geo.width} ${geo.height}">` +
          (fill ? `<rect width="100%" height="100%" fill="${fill}"/>` : "") +
          inner +
          `</svg>`;
        saveBlob(new Blob([out], { type: "image/svg+xml" }), name);
      } else {
        const svgUrl = URL.createObjectURL(
          new Blob([sizedSvg(source, geo.innerW, geo.innerH)], {
            type: "image/svg+xml",
          }),
        );
        try {
          const img = new Image();
          img.decoding = "async";
          img.src = svgUrl;
          await img.decode();
          const canvas = document.createElement("canvas");
          canvas.width = geo.width;
          canvas.height = geo.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Your browser could not create the image.");
          if (fill) {
            ctx.fillStyle = fill;
            ctx.fillRect(0, 0, geo.width, geo.height);
          }
          ctx.drawImage(img, geo.pad, geo.pad, geo.innerW, geo.innerH);
          const blob = await new Promise<Blob | null>((r) =>
            canvas.toBlob(r, MIME[format], 0.95),
          );
          if (!blob) throw new Error("Your browser could not create the image.");
          saveBlob(blob, name);
        } finally {
          URL.revokeObjectURL(svgUrl);
        }
      }
      trackClick(`logo-download:${slug}`, {
        variant: v.id,
        format,
        width: geo.width,
        bg: effectiveBg,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* clipboard blocked — the hex is visible anyway */
    }
  }

  const chip = (active: boolean) =>
    cn(
      "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
      active
        ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
        : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300",
    );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950">
      {/* 1. Version */}
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">1. Choose a version</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {variants.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setVariantId(x.id)}
            aria-pressed={x.id === v.id}
            className={cn(
              "rounded-xl border p-2 text-left transition-colors",
              x.id === v.id
                ? "border-sky-500 ring-2 ring-sky-500/30"
                : "border-slate-200 hover:border-slate-300 dark:border-slate-700",
            )}
          >
            <div
              className={cn(
                "flex h-16 items-center justify-center rounded-lg p-2",
                x.dark ? "bg-slate-900" : "bg-slate-50 dark:bg-slate-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${x.file}.svg`}
                alt={`${brand} logo – ${x.label}`}
                className="max-h-full max-w-full"
                width={x.width > x.height ? 120 : 48}
                height={x.width > x.height ? Math.round((120 * x.height) / x.width) : 48}
              />
            </div>
            <p className="mt-2 text-sm font-semibold">{x.label}</p>
            <p className="text-xs text-slate-500">{x.hint}</p>
          </button>
        ))}
      </div>

      {/* Preview */}
      <div
        className="mt-6 flex min-h-48 items-center justify-center overflow-hidden rounded-xl border border-slate-200 p-4 dark:border-slate-800"
        style={{ background: fill ?? CHECKER }}
        aria-label="Preview"
      >
        <div
          style={{
            background: fill ?? "transparent",
            padding: `${padding}%`,
            width: v.width > v.height ? "min(100%, 520px)" : "min(100%, 220px)",
            boxSizing: "border-box",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${v.file}.svg`} alt={`${brand} logo PNG preview – ${v.label}`} className="block h-auto w-full" />
        </div>
      </div>

      {/* 2. Options */}
      <p className="mt-6 text-sm font-semibold text-slate-800 dark:text-slate-100">2. Format, size &amp; background</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-wide text-slate-500">Format</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["png", "jpg", "webp", "svg"] as Format[]).map((f) => (
              <button key={f} type="button" className={chip(format === f)} onClick={() => setFormat(f)}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-wide text-slate-500">Background</legend>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {(["transparent", "white", "black", "custom"] as Bg[]).map((b) => (
              <button
                key={b}
                type="button"
                className={chip(effectiveBg === b)}
                onClick={() => setBg(b)}
                disabled={format === "jpg" && b === "transparent"}
                title={format === "jpg" && b === "transparent" ? "JPG can't be transparent — use PNG" : undefined}
              >
                {b === "transparent" ? "Transparent" : b[0].toUpperCase() + b.slice(1)}
              </button>
            ))}
            {bg === "custom" && (
              <input
                type="color"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                aria-label="Custom background color"
                className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-transparent"
              />
            )}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-wide text-slate-500">Width (px)</legend>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {SIZES.map((s) => (
              <button key={s} type="button" className={chip(width === s)} onClick={() => setWidth(s)}>
                {s === 4096 ? "4096 (4K)" : s}
              </button>
            ))}
            <input
              type="number"
              min={32}
              max={MAX}
              value={width}
              onChange={(e) => {
                const n = Math.round(Number(e.target.value));
                if (Number.isFinite(n)) setWidth(Math.min(MAX, Math.max(32, n)));
              }}
              aria-label="Custom width in pixels"
              className="h-9 w-24 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Padding: {padding}%
          </legend>
          <input
            type="range"
            min={0}
            max={30}
            value={padding}
            onChange={(e) => setPadding(Number(e.target.value))}
            aria-label="Padding around the logo"
            className="mt-3 w-full accent-sky-600"
          />
        </fieldset>
      </div>

      {/* 3. Download */}
      <div className="mt-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Output: <strong className="text-slate-700 dark:text-slate-200">{geo.width} × {geo.height}px</strong>{" "}
          {format.toUpperCase()}
          {fill ? "" : ", transparent background"}
        </p>
        <button
          type="button"
          onClick={download}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />}
          Download {format.toUpperCase()}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* Brand colors */}
      <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Brand colors — click to copy</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {colors.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => copy(c.hex)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-left hover:border-slate-300 dark:border-slate-700"
            >
              <span className="size-8 shrink-0 rounded-md border border-black/10" style={{ background: c.hex }} />
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-mono text-sm font-semibold">
                  {c.hex}
                  {copied === c.hex ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="size-3.5 text-slate-400" />
                  )}
                </span>
                <span className="block truncate text-xs text-slate-500">{c.name}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
