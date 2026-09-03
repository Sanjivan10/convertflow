"use client";

export type CompressOptions = {
  /** 1..100 */
  quality: number;
  /** Cap the longest side, in px. 0 = keep original size. */
  maxDimension: number;
  /** "keep" | "jpeg" | "webp" | "png" */
  format: "keep" | "jpeg" | "webp" | "png";
  /** If > 0, iterate quality down until the output is <= this many KB. */
  targetKb: number;
  /** For PNG output: reduce to this many colours (0 = no reduction). */
  colors: number;
};

export type CompressedFile = {
  name: string;
  blob: Blob;
  url: string;
  size: number;
  originalSize: number;
};

const MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  webp: "image/webp",
  png: "image/png",
};

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall back */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error("Encoding failed"))),
      type,
      quality,
    ),
  );
}

/** Median-cut-ish palette reduction for PNG output. Cheap and good enough. */
function quantize(ctx: CanvasRenderingContext2D, w: number, h: number, colors: number) {
  if (!colors || colors >= 256) return;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const levels = Math.max(2, Math.round(Math.cbrt(colors)));
  const step = 255 / (levels - 1);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.round(d[i] / step) * step;
    d[i + 1] = Math.round(d[i + 1] / step) * step;
    d[i + 2] = Math.round(d[i + 2] / step) * step;
  }
  ctx.putImageData(img, 0, 0);
}

export async function compressImage(
  file: File,
  opts: CompressOptions,
): Promise<CompressedFile> {
  const source = await decode(file);
  const sw = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const sh = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  let w = sw;
  let h = sh;
  if (opts.maxDimension && Math.max(w, h) > opts.maxDimension) {
    const s = opts.maxDimension / Math.max(w, h);
    w = Math.round(w * s);
    h = Math.round(h * s);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const outFormat =
    opts.format === "keep"
      ? file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpeg"
      : opts.format;
  const outType = MIME[outFormat];

  if (outType !== "image/png" && outType !== "image/webp") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(source, 0, 0, w, h);
  if (source instanceof ImageBitmap) source.close();

  if (outFormat === "png") quantize(ctx, w, h, opts.colors);

  let q = Math.min(1, Math.max(0.05, opts.quality / 100));
  let blob = await toBlob(canvas, outType, q);

  if (opts.targetKb > 0 && outFormat !== "png") {
    const target = opts.targetKb * 1024;
    let attempts = 0;
    while (blob.size > target && q > 0.08 && attempts < 8) {
      q = Math.max(0.08, q - 0.12);
      blob = await toBlob(canvas, outType, q);
      attempts += 1;
    }
  }

  const stem = file.name.replace(/\.[^.]+$/, "");
  const ext = outFormat === "jpeg" ? "jpg" : outFormat;
  return {
    name: `${stem}-compressed.${ext}`,
    blob,
    url: URL.createObjectURL(blob),
    size: blob.size,
    originalSize: file.size,
  };
}
