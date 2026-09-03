"use client";

// Client-side PDF processing engine. Every function takes browser File objects
// and returns Blobs — nothing is uploaded. Heavy work (rasterising, OCR) is
// chunked with `await` yields so the main thread stays responsive.

import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
  type PDFFont,
} from "pdf-lib";
import {
  canvasToBlob,
  extractTextByPage,
  loadPdfDocument,
  renderPage,
} from "./render";

export type OpFile = { name: string; blob: Blob };
export type OpResult = { files: OpFile[]; note?: string };
export type OpOptions = Record<string, string | number | boolean>;

const PDF_MIME = "application/pdf";
const MM_TO_PT = 2.834645669;

const stem = (name: string) => name.replace(/\.[^.]+$/, "");
const pdfBlob = (bytes: Uint8Array) =>
  new Blob([bytes as BlobPart], { type: PDF_MIME });

/** Parse "1-3, 5, 8-10" into an ordered, clamped, 1-based page list. */
export function parseRanges(spec: string, max: number): number[] {
  const out: number[] = [];
  for (const part of spec.split(",").map((s) => s.trim()).filter(Boolean)) {
    const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      let a = Number(range[1]);
      let b = Number(range[2]);
      if (a > b) [a, b] = [b, a];
      for (let i = a; i <= b; i++) if (i >= 1 && i <= max) out.push(i);
    } else if (/^\d+$/.test(part)) {
      const n = Number(part);
      if (n >= 1 && n <= max) out.push(n);
    }
  }
  return out;
}

async function loadDoc(file: File) {
  return PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
}

/* ------------------------------- merge --------------------------------- */

export async function merge(files: File[]): Promise<OpResult> {
  if (files.length < 2) throw new Error("Add at least two PDF files to merge.");
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await loadDoc(file);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  const bytes = await out.save({ useObjectStreams: true });
  return { files: [{ name: "merged.pdf", blob: pdfBlob(bytes) }] };
}

/* ------------------------------- split --------------------------------- */

export async function split(
  files: File[],
  options: OpOptions,
): Promise<OpResult> {
  const file = files[0];
  const src = await loadDoc(file);
  const total = src.getPageCount();
  const mode = String(options.mode ?? "ranges");

  if (mode === "each") {
    const out: OpFile[] = [];
    for (let i = 0; i < total; i++) {
      const doc = await PDFDocument.create();
      const [page] = await doc.copyPages(src, [i]);
      doc.addPage(page);
      const bytes = await doc.save({ useObjectStreams: true });
      out.push({
        name: `${stem(file.name)}-page-${String(i + 1).padStart(3, "0")}.pdf`,
        blob: pdfBlob(bytes),
      });
    }
    return { files: out, note: `Split into ${out.length} single-page PDFs.` };
  }

  const pages = parseRanges(String(options.ranges ?? ""), total);
  if (pages.length === 0)
    throw new Error(`Enter a page range between 1 and ${total}.`);
  const doc = await PDFDocument.create();
  const copied = await doc.copyPages(
    src,
    pages.map((p) => p - 1),
  );
  copied.forEach((p) => doc.addPage(p));
  const bytes = await doc.save({ useObjectStreams: true });
  return {
    files: [
      { name: `${stem(file.name)}-extract.pdf`, blob: pdfBlob(bytes) },
    ],
    note: `Extracted ${pages.length} page${pages.length === 1 ? "" : "s"}.`,
  };
}

/* ------------------------------ rotate --------------------------------- */

export async function rotate(
  files: File[],
  options: OpOptions,
): Promise<OpResult> {
  const file = files[0];
  const doc = await loadDoc(file);
  const total = doc.getPageCount();
  const angle = Number(options.angle ?? 90);
  const scope = String(options.scope ?? "all");
  const targets =
    scope === "all"
      ? Array.from({ length: total }, (_, i) => i + 1)
      : parseRanges(String(options.pages ?? ""), total);

  targets.forEach((n) => {
    const page = doc.getPage(n - 1);
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  });
  const bytes = await doc.save({ useObjectStreams: true });
  return {
    files: [{ name: `${stem(file.name)}-rotated.pdf`, blob: pdfBlob(bytes) }],
  };
}

/* ---------------------------- organise -------------------------------- */

/** `plan` is the final ordered list: [{ src: 0-based source index, rotate }]. */
export async function organize(
  file: File,
  plan: { src: number; rotate: number }[],
): Promise<OpResult> {
  if (plan.length === 0) throw new Error("Keep at least one page.");
  const src = await loadDoc(file);
  const doc = await PDFDocument.create();
  const copied = await doc.copyPages(
    src,
    plan.map((p) => p.src),
  );
  copied.forEach((page, i) => {
    const rot = ((plan[i].rotate % 360) + 360) % 360;
    if (rot) page.setRotation(degrees(rot));
    doc.addPage(page);
  });
  const bytes = await doc.save({ useObjectStreams: true });
  return {
    files: [{ name: `${stem(file.name)}-organized.pdf`, blob: pdfBlob(bytes) }],
  };
}

/* ------------------------------- crop --------------------------------- */

export async function crop(
  files: File[],
  options: OpOptions,
): Promise<OpResult> {
  const file = files[0];
  const doc = await loadDoc(file);
  const top = Number(options.top ?? 0) * MM_TO_PT;
  const right = Number(options.right ?? 0) * MM_TO_PT;
  const bottom = Number(options.bottom ?? 0) * MM_TO_PT;
  const left = Number(options.left ?? 0) * MM_TO_PT;

  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const w = Math.max(1, width - left - right);
    const h = Math.max(1, height - top - bottom);
    page.setCropBox(left, bottom, w, h);
  });
  const bytes = await doc.save({ useObjectStreams: true });
  return {
    files: [{ name: `${stem(file.name)}-cropped.pdf`, blob: pdfBlob(bytes) }],
  };
}

/* --------------------------- page numbers ---------------------------- */

export async function pageNumbers(
  files: File[],
  options: OpOptions,
): Promise<OpResult> {
  const file = files[0];
  const doc = await loadDoc(file);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const size = Number(options.fontSize ?? 12);
  const margin = Number(options.margin ?? 24);
  const start = Number(options.start ?? 1);
  const format = String(options.format ?? "{n}");
  const position = String(options.position ?? "bottom-center");
  const total = doc.getPageCount();

  doc.getPages().forEach((page, i) => {
    const label = format
      .replace(/\{n\}/g, String(start + i))
      .replace(/\{total\}/g, String(total));
    const textWidth = font.widthOfTextAtSize(label, size);
    const { width, height } = page.getSize();
    const isTop = position.startsWith("top");
    const y = isTop ? height - margin - size : margin;
    let x = margin;
    if (position.endsWith("center")) x = (width - textWidth) / 2;
    else if (position.endsWith("right")) x = width - margin - textWidth;
    page.drawText(label, { x, y, size, font, color: rgb(0.25, 0.25, 0.25) });
  });
  const bytes = await doc.save({ useObjectStreams: true });
  return {
    files: [{ name: `${stem(file.name)}-numbered.pdf`, blob: pdfBlob(bytes) }],
  };
}

/* ---------------------------- watermark ------------------------------ */

function hexToRgb(hex: string) {
  const m = hex.replace("#", "");
  const int = parseInt(
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m,
    16,
  );
  return rgb(((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255);
}

export async function watermark(
  files: File[],
  options: OpOptions,
): Promise<OpResult> {
  const file = files[0];
  const doc = await loadDoc(file);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const text = String(options.text ?? "CONFIDENTIAL");
  const size = Number(options.fontSize ?? 52);
  const opacity = Number(options.opacity ?? 0.25);
  const rotationDeg = Number(options.rotation ?? 45);
  const color = hexToRgb(String(options.color ?? "#ff0000"));
  const textWidth = font.widthOfTextAtSize(text, size);

  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 2 - (textWidth / 2) * Math.cos((rotationDeg * Math.PI) / 180),
      y: height / 2 - (textWidth / 2) * Math.sin((rotationDeg * Math.PI) / 180),
      size,
      font,
      color,
      opacity,
      rotate: degrees(rotationDeg),
    });
  });
  const bytes = await doc.save({ useObjectStreams: true });
  return {
    files: [{ name: `${stem(file.name)}-watermarked.pdf`, blob: pdfBlob(bytes) }],
  };
}

/* --------------------------- pdf -> jpg ----------------------------- */

export async function pdfToImages(
  files: File[],
  options: OpOptions,
): Promise<OpResult> {
  const file = files[0];
  const scale = Math.min(4, Math.max(1, Number(options.scale ?? 2)));
  const type = String(options.format ?? "image/jpeg");
  const quality = Number(options.quality ?? 0.9);
  const ext = type === "image/png" ? "png" : "jpg";

  const doc = await loadPdfDocument(await file.arrayBuffer());
  const out: OpFile[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const { canvas } = await renderPage(page, scale);
    const blob = await canvasToBlob(canvas, type, quality);
    out.push({
      name: `${stem(file.name)}-page-${String(i).padStart(3, "0")}.${ext}`,
      blob,
    });
    page.cleanup();
    await new Promise((r) => setTimeout(r, 0));
  }
  await doc.cleanup();
  return { files: out, note: `Rendered ${out.length} page(s) at ${scale}×.` };
}

/* --------------------------- jpg -> pdf ----------------------------- */

const PAGE_SIZES: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

export async function imagesToPdf(
  files: File[],
  options: OpOptions,
): Promise<OpResult> {
  if (files.length === 0) throw new Error("Add at least one image.");
  const doc = await PDFDocument.create();
  const sizeKey = String(options.pageSize ?? "fit");
  const orientation = String(options.orientation ?? "portrait");
  const margin = Number(options.margin ?? 0) * MM_TO_PT;

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isPng =
      file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

    if (sizeKey === "fit") {
      const page = doc.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      continue;
    }
    let [pw, ph] = PAGE_SIZES[sizeKey] ?? PAGE_SIZES.a4;
    if (orientation === "landscape") [pw, ph] = [ph, pw];
    const page = doc.addPage([pw, ph]);
    const availW = pw - margin * 2;
    const availH = ph - margin * 2;
    const scale = Math.min(availW / img.width, availH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    page.drawImage(img, {
      x: (pw - w) / 2,
      y: (ph - h) / 2,
      width: w,
      height: h,
    });
  }
  const bytes = await doc.save({ useObjectStreams: true });
  return { files: [{ name: "images.pdf", blob: pdfBlob(bytes) }] };
}

/* ---------------------------- compress ----------------------------- */

export async function compress(
  files: File[],
  options: OpOptions,
): Promise<OpResult> {
  const file = files[0];
  const before = file.size;
  const mode = String(options.mode ?? "lossless");

  if (mode === "lossless") {
    const doc = await loadDoc(file);
    doc.setProducer("ConvertFlow");
    const bytes = await doc.save({ useObjectStreams: true });
    return {
      files: [{ name: `${stem(file.name)}-compressed.pdf`, blob: pdfBlob(bytes) }],
      note: sizeDelta(before, bytes.byteLength),
    };
  }

  // strong: rasterise every page at reduced DPI + JPEG quality.
  const dpi = Number(options.dpi ?? 110);
  const quality = Number(options.quality ?? 0.6);
  const scale = dpi / 72;
  const src = await loadPdfDocument(await file.arrayBuffer());
  const out = await PDFDocument.create();
  for (let i = 1; i <= src.numPages; i++) {
    const page = await src.getPage(i);
    const { canvas } = await renderPage(page, scale);
    const jpg = await canvasToBlob(canvas, "image/jpeg", quality);
    const img = await out.embedJpg(new Uint8Array(await jpg.arrayBuffer()));
    const vp = page.getViewport({ scale: 1 });
    const p = out.addPage([vp.width, vp.height]);
    p.drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height });
    page.cleanup();
    await new Promise((r) => setTimeout(r, 0));
  }
  await src.cleanup();
  const bytes = await out.save({ useObjectStreams: true });
  return {
    files: [{ name: `${stem(file.name)}-compressed.pdf`, blob: pdfBlob(bytes) }],
    note: sizeDelta(before, bytes.byteLength),
  };
}

function sizeDelta(before: number, after: number): string {
  const pct = Math.round((1 - after / before) * 100);
  const fmt = (n: number) => `${(n / 1024 / 1024).toFixed(2)} MB`;
  if (pct <= 0)
    return `Already optimised — ${fmt(before)} → ${fmt(after)} (no reduction).`;
  return `Reduced ${pct}% — ${fmt(before)} → ${fmt(after)}.`;
}

/* ----------------------------- repair ----------------------------- */

export async function repair(files: File[]): Promise<OpResult> {
  const file = files[0];
  try {
    const src = await PDFDocument.load(await file.arrayBuffer(), {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
      updateMetadata: false,
    });
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(src, src.getPageIndices());
    pages.forEach((p) => doc.addPage(p));
    const bytes = await doc.save({ useObjectStreams: true });
    return {
      files: [{ name: `${stem(file.name)}-repaired.pdf`, blob: pdfBlob(bytes) }],
      note: `Rebuilt cross-reference table and recovered ${pages.length} page(s).`,
    };
  } catch (err) {
    throw new Error(
      `This file is too damaged to recover in the browser (${
        err instanceof Error ? err.message : "parse failed"
      }). A server-side rebuild may still work.`,
    );
  }
}

/* ---------------------------- unlock ------------------------------ */

export async function unlock(
  files: File[],
  options: OpOptions,
): Promise<OpResult> {
  const file = files[0];
  const password = String(options.password ?? "");
  try {
    const { PDFDocument: Cantoo } = await import("@cantoo/pdf-lib");
    const src = await Cantoo.load(await file.arrayBuffer(), {
      ignoreEncryption: true,
      ...(password ? { password } : {}),
    });
    const doc = await Cantoo.create();
    const pages = await doc.copyPages(src, src.getPageIndices());
    pages.forEach((p) => doc.addPage(p));
    const bytes = await doc.save();
    return {
      files: [{ name: `${stem(file.name)}-unlocked.pdf`, blob: pdfBlob(bytes) }],
      note: "Password and permission restrictions removed.",
    };
  } catch {
    throw new Error(
      "Could not open this file. If it needs a password to open, enter the correct one above.",
    );
  }
}

/* ---------------------------- protect ---------------------------- */

export async function protect(
  files: File[],
  options: OpOptions,
): Promise<OpResult> {
  const file = files[0];
  const userPassword = String(options.userPassword ?? "");
  if (!userPassword) throw new Error("Set an open password.");
  const ownerPassword = String(options.ownerPassword ?? "") || userPassword;
  try {
    const { PDFDocument: Cantoo } = await import("@cantoo/pdf-lib");
    const doc = await Cantoo.load(await file.arrayBuffer(), {
      ignoreEncryption: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (doc as any).encrypt({
      userPassword,
      ownerPassword,
      permissions: {
        printing: options.allowPrint === false ? undefined : "highResolution",
        copying: options.allowCopy !== false,
        modifying: options.allowModify === true,
      },
    });
    const bytes = await doc.save();
    return {
      files: [{ name: `${stem(file.name)}-protected.pdf`, blob: pdfBlob(bytes) }],
      note: "Encrypted. The open password is required to view this file.",
    };
  } catch (err) {
    throw new Error(
      `Encryption failed in the browser (${
        err instanceof Error ? err.message : "unknown"
      }).`,
    );
  }
}

/* -------------------------- pdf -> word ------------------------- */

function groupLines(
  items: { str: string; x: number; y: number; height: number }[],
): string[] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: { y: number; parts: { x: number; str: string }[] }[] = [];
  for (const it of sorted) {
    const line = lines.find((l) => Math.abs(l.y - it.y) < (it.height || 6) * 0.7);
    if (line) line.parts.push({ x: it.x, str: it.str });
    else lines.push({ y: it.y, parts: [{ x: it.x, str: it.str }] });
  }
  return lines.map((l) =>
    l.parts
      .sort((a, b) => a.x - b.x)
      .map((p) => p.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

export async function pdfToWord(files: File[]): Promise<OpResult> {
  const file = files[0];
  const pages = await extractTextByPage(await file.arrayBuffer());
  const htmlParts: string[] = [];
  for (const page of pages) {
    for (const line of groupLines(page.items)) {
      htmlParts.push(
        line
          ? `<p>${line
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")}</p>`
          : "<p>&nbsp;</p>",
      );
    }
    htmlParts.push('<p style="page-break-after:always">&nbsp;</p>');
  }
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${stem(
    file.name,
  )}</title></head><body style="font-family:Calibri,Arial,sans-serif;font-size:11pt">${htmlParts.join(
    "",
  )}</body></html>`;
  return {
    files: [
      {
        name: `${stem(file.name)}.doc`,
        blob: new Blob([html], { type: "application/msword" }),
      },
    ],
    note: "Text extracted to an editable .doc. Fonts, columns, tables, and images are not reconstructed.",
  };
}

/* -------------------------- pdf -> excel ------------------------ */

export async function pdfToExcel(files: File[]): Promise<OpResult> {
  const file = files[0];
  const pages = await extractTextByPage(await file.arrayBuffer());
  const rows: string[] = [];
  for (const page of pages) {
    const sorted = [...page.items].sort((a, b) => a.y - b.y || a.x - b.x);
    const lines: { y: number; cells: { x: number; str: string }[] }[] = [];
    for (const it of sorted) {
      const line = lines.find(
        (l) => Math.abs(l.y - it.y) < (it.height || 6) * 0.7,
      );
      if (line) line.cells.push({ x: it.x, str: it.str });
      else lines.push({ y: it.y, cells: [{ x: it.x, str: it.str }] });
    }
    for (const line of lines) {
      const cells = line.cells.sort((a, b) => a.x - b.x);
      const merged: string[] = [];
      let prevX = -Infinity;
      for (const c of cells) {
        if (c.x - prevX > 24) merged.push(c.str);
        else merged[merged.length - 1] = `${merged[merged.length - 1]} ${c.str}`;
        prevX = c.x;
      }
      rows.push(
        merged
          .map((v) => `"${v.replace(/"/g, '""').replace(/\s+/g, " ").trim()}"`)
          .join(","),
      );
    }
    rows.push("");
  }
  return {
    files: [
      {
        name: `${stem(file.name)}.csv`,
        blob: new Blob(["﻿" + rows.join("\r\n")], { type: "text/csv" }),
      },
    ],
    note: "Tabular text exported to CSV — open in Excel, Numbers, or Sheets and save as .xlsx.",
  };
}

/* ---------------------------- OCR ------------------------------ */

export async function ocr(
  files: File[],
  options: OpOptions,
  onProgress?: (fraction: number, label: string) => void,
): Promise<OpResult> {
  const file = files[0];
  const scale = Math.min(4, Math.max(1.5, Number(options.scale ?? 2)));
  const lang = String(options.lang ?? "eng");
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(lang, 1, {
    logger: (m: { status: string; progress: number }) =>
      onProgress?.(m.progress, m.status),
  });

  const doc = await loadPdfDocument(await file.arrayBuffer());
  const chunks: string[] = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const { canvas } = await renderPage(page, scale);
      const { data } = await worker.recognize(canvas);
      chunks.push(`\n\n===== Page ${i} =====\n${data.text.trim()}`);
      page.cleanup();
      onProgress?.(i / doc.numPages, `page ${i}/${doc.numPages}`);
    }
  } finally {
    await worker.terminate();
    await doc.cleanup();
  }
  const text = chunks.join("\n").trim();
  return {
    files: [
      {
        name: `${stem(file.name)}-ocr.txt`,
        blob: new Blob([text], { type: "text/plain" }),
      },
    ],
    note: `Recognised ${text.split(/\s+/).length} words. Accuracy depends on scan quality.`,
  };
}

/* --------------------------- forms ---------------------------- */

export type FormFieldInfo = {
  name: string;
  type: "text" | "checkbox" | "radio" | "dropdown" | "optionlist" | "button";
  value: string;
  options?: string[];
};

export async function readFormFields(file: File): Promise<FormFieldInfo[]> {
  const doc = await loadDoc(file);
  const form = doc.getForm();
  return form.getFields().map((f) => {
    const name = f.getName();
    const ctor = f.constructor.name;
    if (ctor === "PDFCheckBox")
      return {
        name,
        type: "checkbox",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: (f as any).isChecked?.() ? "true" : "false",
      };
    if (ctor === "PDFRadioGroup")
      return {
        name,
        type: "radio",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: (f as any).getSelected?.() ?? "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: (f as any).getOptions?.() ?? [],
      };
    if (ctor === "PDFDropdown")
      return {
        name,
        type: "dropdown",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: ((f as any).getSelected?.() ?? [])[0] ?? "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: (f as any).getOptions?.() ?? [],
      };
    if (ctor === "PDFTextField")
      return {
        name,
        type: "text",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: (f as any).getText?.() ?? "",
      };
    return { name, type: "button", value: "" };
  });
}

export async function fillForm(
  file: File,
  values: Record<string, string>,
  flatten: boolean,
): Promise<OpResult> {
  const doc = await loadDoc(file);
  const form = doc.getForm();
  for (const field of form.getFields()) {
    const name = field.getName();
    if (!(name in values)) continue;
    const raw = values[name];
    const ctor = field.constructor.name;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = field as any;
      if (ctor === "PDFCheckBox") {
        if (raw === "true") f.check();
        else f.uncheck();
      }
      else if (ctor === "PDFRadioGroup" && raw) f.select(raw);
      else if (ctor === "PDFDropdown" && raw) f.select(raw);
      else if (ctor === "PDFTextField") f.setText(raw);
    } catch {
      /* skip fields that reject the value */
    }
  }
  if (flatten) form.flatten();
  const bytes = await doc.save({ useObjectStreams: true });
  return {
    files: [
      {
        name: `${stem(file.name)}-filled.pdf`,
        blob: pdfBlob(bytes),
      },
    ],
    note: flatten ? "Form values flattened into the page content." : undefined,
  };
}

/* ------------------- burn raster pages (redact / edit) ------------- */

/** Replace the given 0-based page indices with a flattened raster, keep the rest. */
export async function burnPages(
  file: File,
  rasters: Map<number, Blob>,
): Promise<OpResult> {
  const src = await loadPdfDocument(await file.arrayBuffer());
  const out = await PDFDocument.create();
  for (let i = 1; i <= src.numPages; i++) {
    const page = await src.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const raster = rasters.get(i - 1);
    if (raster) {
      const png = await out.embedPng(new Uint8Array(await raster.arrayBuffer()));
      const p = out.addPage([vp.width, vp.height]);
      p.drawImage(png, { x: 0, y: 0, width: vp.width, height: vp.height });
    } else {
      const embedded = await loadDoc(file).then((d) =>
        out.copyPages(d, [i - 1]),
      );
      out.addPage(embedded[0]);
    }
    page.cleanup();
  }
  await src.cleanup();
  const bytes = await out.save({ useObjectStreams: true });
  return {
    files: [{ name: `${stem(file.name)}-edited.pdf`, blob: pdfBlob(bytes) }],
  };
}

/* --------------------- stamp image (sign) ---------------------- */

export async function stampImage(
  file: File,
  imageDataUrl: string,
  placement: { page: number; xPct: number; yPct: number; wPct: number },
): Promise<OpResult> {
  const doc = await loadDoc(file);
  const pngBytes = Uint8Array.from(
    atob(imageDataUrl.split(",")[1]),
    (c) => c.charCodeAt(0),
  );
  const img = await doc.embedPng(pngBytes);
  const page = doc.getPage(Math.max(0, placement.page - 1));
  const { width, height } = page.getSize();
  const w = width * placement.wPct;
  const h = w * (img.height / img.width);
  page.drawImage(img, {
    x: width * placement.xPct,
    y: height * (1 - placement.yPct) - h,
    width: w,
    height: h,
  });
  const bytes = await doc.save({ useObjectStreams: true });
  return {
    files: [{ name: `${stem(file.name)}-signed.pdf`, blob: pdfBlob(bytes) }],
  };
}

/* ------------------------- html -> pdf ------------------------ */

export async function htmlToPdf(
  html: string,
  options: OpOptions,
): Promise<OpResult> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const holder = document.createElement("div");
  holder.style.cssText =
    "position:fixed;left:-10000px;top:0;width:794px;background:#fff;padding:24px;color:#000";
  holder.innerHTML = html;
  document.body.appendChild(holder);
  try {
    const canvas = await html2canvas(holder, { scale: 2, useCORS: true });
    const pdf = new jsPDF({
      orientation: String(options.orientation ?? "portrait") as "portrait",
      unit: "pt",
      format: "a4",
    });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pageW) / canvas.width;
    let remaining = imgH;
    let position = 0;
    const img = canvas.toDataURL("image/jpeg", 0.92);
    pdf.addImage(img, "JPEG", 0, position, pageW, imgH);
    remaining -= pageH;
    while (remaining > 0) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(img, "JPEG", 0, position, pageW, imgH);
      remaining -= pageH;
    }
    const blob = pdf.output("blob");
    return { files: [{ name: "document.pdf", blob }] };
  } finally {
    holder.remove();
  }
}

/* ----------------------- simple dispatcher --------------------- */

/** Handles the ops that need only a dropzone + options form + run button. */
export async function runSimpleOp(
  op: string,
  files: File[],
  options: OpOptions,
): Promise<OpResult> {
  switch (op) {
    case "merge":
      return merge(files);
    case "split":
      return split(files, options);
    case "rotate":
      return rotate(files, options);
    case "crop":
      return crop(files, options);
    case "page-numbers":
      return pageNumbers(files, options);
    case "watermark":
      return watermark(files, options);
    case "pdf-to-jpg":
      return pdfToImages(files, options);
    case "jpg-to-pdf":
    case "scan-to-pdf":
      return imagesToPdf(files, options);
    case "compress":
      return compress(files, options);
    case "repair":
      return repair(files);
    case "unlock":
      return unlock(files, options);
    case "protect":
      return protect(files, options);
    case "pdf-to-word":
      return pdfToWord(files);
    case "pdf-to-excel":
      return pdfToExcel(files);
    default:
      throw new Error(`Operation "${op}" is not a simple op.`);
  }
}

export type { PDFFont };
