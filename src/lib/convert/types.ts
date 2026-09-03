export type ConvertOptions = {
  /** 0..1 quality for lossy encoders (jpg / webp). */
  quality: number;
  /** Optional max width/height in px; images larger are scaled down. */
  maxDimension?: number;
  /** Background colour used when flattening transparency to a non-alpha format. */
  background: string;
};

export type ConvertInput = {
  files: File[];
  fromFormat: string;
  toFormat: string;
  options: ConvertOptions;
};

export type ConvertResultFile = {
  name: string;
  blob: Blob;
  url: string;
  size: number;
};

export type ConvertResult = {
  files: ConvertResultFile[];
  durationMs: number;
};

export const DEFAULT_OPTIONS: ConvertOptions = {
  quality: 0.92,
  background: "#ffffff",
};

const MIME_BY_FORMAT: Record<string, string> = {
  PNG: "image/png",
  JPG: "image/jpeg",
  JPEG: "image/jpeg",
  WEBP: "image/webp",
  GIF: "image/gif",
  BMP: "image/bmp",
  PDF: "application/pdf",
};

export function mimeFor(format: string): string {
  return MIME_BY_FORMAT[format.toUpperCase()] ?? "application/octet-stream";
}

export function extFor(format: string): string {
  const f = format.toLowerCase();
  return f === "jpeg" ? "jpg" : f;
}

export function swapExtension(filename: string, toFormat: string): string {
  const dot = filename.lastIndexOf(".");
  const stem = dot === -1 ? filename : filename.slice(0, dot);
  return `${stem}.${extFor(toFormat)}`;
}
