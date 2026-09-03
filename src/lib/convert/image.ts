import {
  type ConvertInput,
  type ConvertResult,
  mimeFor,
  swapExtension,
} from "./types";

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall back to <img> for formats createImageBitmap rejects */
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

function dimsOf(source: ImageBitmap | HTMLImageElement): {
  width: number;
  height: number;
} {
  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  return { width: source.width, height: source.height };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed"))),
      type,
      quality,
    );
  });
}

/**
 * Convert raster images between formats using an offscreen <canvas>.
 * Runs fully client-side; nothing is uploaded.
 */
export async function convertImages(
  input: ConvertInput,
): Promise<ConvertResult> {
  const start = performance.now();
  const targetMime = mimeFor(input.toFormat);
  const lossless = targetMime === "image/png";
  const supportsAlpha = targetMime === "image/png" || targetMime === "image/webp";

  const out: ConvertResult["files"] = [];

  for (const file of input.files) {
    const source = await decode(file);
    const { width, height } = dimsOf(source);

    let w = width;
    let h = height;
    const max = input.options.maxDimension;
    if (max && (w > max || h > max)) {
      const scale = Math.min(max / w, max / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    if (!supportsAlpha) {
      ctx.fillStyle = input.options.background;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(source, 0, 0, w, h);
    if (source instanceof ImageBitmap) source.close();

    const blob = await canvasToBlob(
      canvas,
      targetMime,
      lossless ? 1 : input.options.quality,
    );
    const name = swapExtension(file.name, input.toFormat);
    out.push({
      name,
      blob,
      url: URL.createObjectURL(blob),
      size: blob.size,
    });
  }

  return { files: out, durationMs: Math.round(performance.now() - start) };
}
