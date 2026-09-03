"use client";

// Thin wrapper around pdf.js. Imported only from client components, and always
// via dynamic import so the ~1MB worker payload stays out of the initial bundle.
import type {
  PDFDocumentProxy,
  PDFPageProxy,
} from "pdfjs-dist/types/src/display/api";

type PdfjsModule = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfjsModule> | null = null;

export async function getPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      // Worker is served from a version-matched CDN build.
      mod.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.version}/pdf.worker.min.mjs`;
      return mod;
    });
  }
  return pdfjsPromise;
}

export async function loadPdfDocument(
  data: ArrayBuffer | Uint8Array,
): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfjs();
  const task = pdfjs.getDocument({
    data,
    // pdf.js standard fonts, for pages that rely on them.
    standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/standard_fonts/`,
  });
  return task.promise;
}

export type RenderedPage = {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
};

export async function renderPage(
  page: PDFPageProxy,
  scale: number,
): Promise<RenderedPage> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return {
    pageNumber: page.pageNumber,
    canvas,
    width: canvas.width,
    height: canvas.height,
  };
}

/** Render every page to a data URL at a small scale, for thumbnail grids. */
export async function renderThumbnails(
  data: ArrayBuffer,
  scale = 0.4,
): Promise<{ pageNumber: number; dataUrl: string; ratio: number }[]> {
  const doc = await loadPdfDocument(data.slice(0));
  const out: { pageNumber: number; dataUrl: string; ratio: number }[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const { canvas } = await renderPage(page, scale);
    out.push({
      pageNumber: i,
      dataUrl: canvas.toDataURL("image/jpeg", 0.7),
      ratio: canvas.height / canvas.width,
    });
    page.cleanup();
  }
  await doc.cleanup();
  return out;
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/jpeg",
  quality = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Encoding failed"))),
      type,
      quality,
    ),
  );
}

export async function extractTextByPage(data: ArrayBuffer): Promise<
  {
    page: number;
    items: { str: string; x: number; y: number; width: number; height: number }[];
  }[]
> {
  const doc = await loadPdfDocument(data.slice(0));
  const pages: {
    page: number;
    items: { str: string; x: number; y: number; width: number; height: number }[];
  }[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    const items = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((raw: any) => {
        const tx = raw.transform as number[];
        return {
          str: raw.str as string,
          x: tx[4],
          y: viewport.height - tx[5],
          width: raw.width as number,
          height: raw.height as number,
        };
      })
      .filter((it) => it.str.length > 0);
    pages.push({ page: i, items });
    page.cleanup();
  }
  await doc.cleanup();
  return pages;
}
