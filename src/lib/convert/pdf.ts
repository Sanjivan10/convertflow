import { PDFDocument } from "pdf-lib";
import {
  type ConvertInput,
  type ConvertResult,
  swapExtension,
} from "./types";

async function imagesToPdf(files: File[]): Promise<Blob> {
  const doc = await PDFDocument.create();

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isPng =
      file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    const image = isPng
      ? await doc.embedPng(bytes)
      : await doc.embedJpg(bytes);
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  const saved = await doc.save({ useObjectStreams: true });
  return new Blob([saved as BlobPart], { type: "application/pdf" });
}

async function mergePdfs(files: File[]): Promise<Blob> {
  const merged = await PDFDocument.create();
  for (const file of files) {
    const src = await PDFDocument.load(await file.arrayBuffer());
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const saved = await merged.save({ useObjectStreams: true });
  return new Blob([saved as BlobPart], { type: "application/pdf" });
}

async function optimisePdf(file: File): Promise<Blob> {
  const doc = await PDFDocument.load(await file.arrayBuffer());
  const saved = await doc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });
  return new Blob([saved as BlobPart], { type: "application/pdf" });
}

export async function convertPdf(input: ConvertInput): Promise<ConvertResult> {
  const start = performance.now();
  const { files, toFormat, fromFormat } = input;
  if (files.length === 0) throw new Error("Add at least one file");

  let blob: Blob;
  let name: string;

  const isImageSource = /^(jpe?g|png)$/i.test(fromFormat);

  if (isImageSource && toFormat.toUpperCase() === "PDF") {
    blob = await imagesToPdf(files);
    name = swapExtension(files[0].name, "pdf");
    if (files.length > 1) name = "combined.pdf";
  } else if (files.length > 1) {
    blob = await mergePdfs(files);
    name = "merged.pdf";
  } else {
    blob = await optimisePdf(files[0]);
    name = files[0].name.replace(/\.pdf$/i, "") + ".pdf";
  }

  return {
    files: [
      { name, blob, url: URL.createObjectURL(blob), size: blob.size },
    ],
    durationMs: Math.round(performance.now() - start),
  };
}
