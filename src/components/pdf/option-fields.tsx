"use client";

import { Input, Label, Select } from "@/components/ui/input";
import type { OpOptions } from "@/lib/pdf/ops";

type Field =
  | { kind: "text"; key: string; label: string; placeholder?: string; default?: string }
  | { kind: "number"; key: string; label: string; min?: number; max?: number; step?: number; default: number }
  | { kind: "select"; key: string; label: string; options: { value: string; label: string }[]; default: string }
  | { kind: "range"; key: string; label: string; min: number; max: number; step: number; default: number; suffix?: string }
  | { kind: "checkbox"; key: string; label: string; default: boolean }
  | { kind: "password"; key: string; label: string; placeholder?: string; default?: string };

export const OP_FIELDS: Record<string, Field[]> = {
  split: [
    {
      kind: "select",
      key: "mode",
      label: "Mode",
      default: "ranges",
      options: [
        { value: "ranges", label: "Extract a page range" },
        { value: "each", label: "Split every page into its own PDF" },
      ],
    },
    {
      kind: "text",
      key: "ranges",
      label: "Pages (e.g. 1-3, 5, 8-10)",
      placeholder: "1-3, 5",
    },
  ],
  rotate: [
    {
      kind: "select",
      key: "angle",
      label: "Rotation",
      default: "90",
      options: [
        { value: "90", label: "90° clockwise" },
        { value: "180", label: "180°" },
        { value: "270", label: "270° (90° counter-clockwise)" },
      ],
    },
    {
      kind: "select",
      key: "scope",
      label: "Apply to",
      default: "all",
      options: [
        { value: "all", label: "All pages" },
        { value: "pages", label: "Specific pages" },
      ],
    },
    { kind: "text", key: "pages", label: "Pages", placeholder: "2, 4-6" },
  ],
  crop: [
    { kind: "number", key: "top", label: "Top margin (mm)", default: 10, min: 0, step: 1 },
    { kind: "number", key: "right", label: "Right margin (mm)", default: 10, min: 0, step: 1 },
    { kind: "number", key: "bottom", label: "Bottom margin (mm)", default: 10, min: 0, step: 1 },
    { kind: "number", key: "left", label: "Left margin (mm)", default: 10, min: 0, step: 1 },
  ],
  "page-numbers": [
    {
      kind: "select",
      key: "position",
      label: "Position",
      default: "bottom-center",
      options: [
        { value: "bottom-center", label: "Bottom centre" },
        { value: "bottom-right", label: "Bottom right" },
        { value: "bottom-left", label: "Bottom left" },
        { value: "top-center", label: "Top centre" },
        { value: "top-right", label: "Top right" },
        { value: "top-left", label: "Top left" },
      ],
    },
    {
      kind: "select",
      key: "format",
      label: "Format",
      default: "{n}",
      options: [
        { value: "{n}", label: "1, 2, 3 …" },
        { value: "{n} / {total}", label: "1 / 24" },
        { value: "Page {n}", label: "Page 1" },
        { value: "Page {n} of {total}", label: "Page 1 of 24" },
      ],
    },
    { kind: "number", key: "start", label: "Start at", default: 1, min: 0, step: 1 },
    { kind: "number", key: "fontSize", label: "Font size", default: 12, min: 6, max: 48, step: 1 },
    { kind: "number", key: "margin", label: "Edge margin (pt)", default: 24, min: 4, step: 1 },
  ],
  watermark: [
    { kind: "text", key: "text", label: "Watermark text", default: "CONFIDENTIAL" },
    { kind: "range", key: "opacity", label: "Opacity", min: 0.05, max: 1, step: 0.05, default: 0.25 },
    { kind: "range", key: "rotation", label: "Rotation", min: 0, max: 90, step: 5, default: 45, suffix: "°" },
    { kind: "number", key: "fontSize", label: "Font size", default: 52, min: 12, max: 160, step: 2 },
    { kind: "text", key: "color", label: "Colour (hex)", default: "#ff0000" },
  ],
  "pdf-to-jpg": [
    {
      kind: "select",
      key: "format",
      label: "Image format",
      default: "image/jpeg",
      options: [
        { value: "image/jpeg", label: "JPG" },
        { value: "image/png", label: "PNG" },
      ],
    },
    { kind: "range", key: "scale", label: "Resolution", min: 1, max: 4, step: 0.5, default: 2, suffix: "×" },
    { kind: "range", key: "quality", label: "JPG quality", min: 0.4, max: 1, step: 0.05, default: 0.9 },
  ],
  "jpg-to-pdf": [
    {
      kind: "select",
      key: "pageSize",
      label: "Page size",
      default: "fit",
      options: [
        { value: "fit", label: "Fit to image" },
        { value: "a4", label: "A4" },
        { value: "letter", label: "US Letter" },
      ],
    },
    {
      kind: "select",
      key: "orientation",
      label: "Orientation",
      default: "portrait",
      options: [
        { value: "portrait", label: "Portrait" },
        { value: "landscape", label: "Landscape" },
      ],
    },
    { kind: "number", key: "margin", label: "Margin (mm)", default: 0, min: 0, step: 1 },
  ],
  "scan-to-pdf": [
    {
      kind: "select",
      key: "pageSize",
      label: "Page size",
      default: "a4",
      options: [
        { value: "fit", label: "Fit to photo" },
        { value: "a4", label: "A4" },
        { value: "letter", label: "US Letter" },
      ],
    },
    { kind: "number", key: "margin", label: "Margin (mm)", default: 8, min: 0, step: 1 },
  ],
  compress: [
    {
      kind: "select",
      key: "mode",
      label: "Mode",
      default: "lossless",
      options: [
        { value: "lossless", label: "Lossless — repack structure" },
        { value: "strong", label: "Strong — downscale page images" },
      ],
    },
    { kind: "range", key: "dpi", label: "Target DPI (strong)", min: 72, max: 200, step: 2, default: 110 },
    { kind: "range", key: "quality", label: "JPEG quality (strong)", min: 0.3, max: 0.9, step: 0.05, default: 0.6 },
  ],
  unlock: [
    { kind: "password", key: "password", label: "Current password (if any)", placeholder: "Leave blank if none" },
  ],
  protect: [
    { kind: "password", key: "userPassword", label: "Open password (required)" },
    { kind: "password", key: "ownerPassword", label: "Owner password (optional)" },
    { kind: "checkbox", key: "allowPrint", label: "Allow printing", default: true },
    { kind: "checkbox", key: "allowCopy", label: "Allow copying text", default: true },
    { kind: "checkbox", key: "allowModify", label: "Allow editing", default: false },
  ],
  ocr: [
    { kind: "range", key: "scale", label: "Render scale", min: 1.5, max: 4, step: 0.5, default: 2, suffix: "×" },
    {
      kind: "select",
      key: "lang",
      label: "Language",
      default: "eng",
      options: [
        { value: "eng", label: "English" },
        { value: "spa", label: "Spanish" },
        { value: "fra", label: "French" },
        { value: "deu", label: "German" },
        { value: "por", label: "Portuguese" },
      ],
    },
  ],
  "html-to-pdf": [
    {
      kind: "select",
      key: "orientation",
      label: "Orientation",
      default: "portrait",
      options: [
        { value: "portrait", label: "Portrait" },
        { value: "landscape", label: "Landscape" },
      ],
    },
  ],
};

export function defaultsFor(op: string): OpOptions {
  const values: OpOptions = {};
  for (const field of OP_FIELDS[op] ?? []) {
    if (field.kind === "checkbox") values[field.key] = field.default;
    else if (field.kind === "text" || field.kind === "password")
      values[field.key] = field.default ?? "";
    else values[field.key] = field.default;
  }
  return values;
}

export function OptionFields({
  op,
  values,
  onChange,
}: {
  op: string;
  values: OpOptions;
  onChange: (values: OpOptions) => void;
}) {
  const fields = OP_FIELDS[op] ?? [];
  if (fields.length === 0) return null;

  const set = (key: string, value: string | number | boolean) =>
    onChange({ ...values, [key]: value });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label htmlFor={`opt-${field.key}`}>
            {field.label}
            {field.kind === "range" && (
              <span className="ml-2 text-xs tabular-nums text-slate-400">
                {String(values[field.key] ?? field.default)}
                {field.suffix ?? ""}
              </span>
            )}
          </Label>

          {field.kind === "select" && (
            <Select
              id={`opt-${field.key}`}
              value={String(values[field.key] ?? field.default)}
              onChange={(e) => set(field.key, e.target.value)}
            >
              {field.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          )}

          {(field.kind === "text" || field.kind === "password") && (
            <Input
              id={`opt-${field.key}`}
              type={field.kind === "password" ? "password" : "text"}
              placeholder={field.placeholder}
              value={String(values[field.key] ?? "")}
              onChange={(e) => set(field.key, e.target.value)}
            />
          )}

          {field.kind === "number" && (
            <Input
              id={`opt-${field.key}`}
              type="number"
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
              value={Number(values[field.key] ?? field.default)}
              onChange={(e) => set(field.key, Number(e.target.value))}
            />
          )}

          {field.kind === "range" && (
            <input
              id={`opt-${field.key}`}
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              value={Number(values[field.key] ?? field.default)}
              onChange={(e) => set(field.key, Number(e.target.value))}
              className="w-full accent-sky-600"
            />
          )}

          {field.kind === "checkbox" && (
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                id={`opt-${field.key}`}
                type="checkbox"
                checked={Boolean(values[field.key])}
                onChange={(e) => set(field.key, e.target.checked)}
                className="size-4 accent-sky-600"
              />
              Enabled
            </label>
          )}
        </div>
      ))}
    </div>
  );
}
