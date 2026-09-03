"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { GripVertical, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { saveFooter } from "@/app/admin/(protected)/footer-actions";
import type { FooterColumn, FooterConfig } from "@/lib/footer";

const PALETTES: { name: string; bg: string; text: string; heading: string; link: string }[] = [
  { name: "Light", bg: "#f8fafc", text: "#64748b", heading: "#334155", link: "#0284c7" },
  { name: "Slate", bg: "#0f172a", text: "#94a3b8", heading: "#e2e8f0", link: "#38bdf8" },
  { name: "Midnight", bg: "#020617", text: "#64748b", heading: "#f1f5f9", link: "#818cf8" },
  { name: "Warm", bg: "#1c1917", text: "#a8a29e", heading: "#fafaf9", link: "#fbbf24" },
  { name: "Emerald", bg: "#052e16", text: "#86efac", heading: "#f0fdf4", link: "#4ade80" },
];

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
      Save footer
    </Button>
  );
}

export function FooterBuilder({ config }: { config: FooterConfig }) {
  const [columns, setColumns] = useState<FooterColumn[]>(config.columns);
  const [tagline, setTagline] = useState(config.tagline);
  const [bottomText, setBottomText] = useState(config.bottomText);
  const [bgColor, setBg] = useState(config.bgColor);
  const [textColor, setText] = useState(config.textColor);
  const [headingColor, setHeading] = useState(config.headingColor);
  const [linkColor, setLink] = useState(config.linkColor);
  const [columnsCount, setCount] = useState(config.columnsCount);
  const [align, setAlign] = useState<FooterConfig["align"]>(config.align);
  const dragCol = useRef<number | null>(null);

  const payload = JSON.stringify({
    columns,
    tagline,
    bottomText,
    bgColor,
    textColor,
    headingColor,
    linkColor,
    columnsCount,
    align,
  });

  const patchCol = (i: number, patch: Partial<FooterColumn>) =>
    setColumns((c) => c.map((col, idx) => (idx === i ? { ...col, ...patch } : col)));
  const patchLink = (ci: number, li: number, patch: Partial<{ label: string; href: string }>) =>
    setColumns((c) =>
      c.map((col, idx) =>
        idx === ci
          ? {
              ...col,
              links: col.links.map((l, j) => (j === li ? { ...l, ...patch } : l)),
            }
          : col,
      ),
    );

  return (
    <form action={saveFooter} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="payload" value={payload} />

      {/* ---- editor ---- */}
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="mb-3 text-sm font-semibold">Columns</p>
          <div className="space-y-3">
            {columns.map((col, ci) => (
              <div
                key={ci}
                draggable
                onDragStart={() => (dragCol.current = ci)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = dragCol.current;
                  if (from === null || from === ci) return;
                  setColumns((c) => {
                    const next = [...c];
                    const [m] = next.splice(from, 1);
                    next.splice(ci, 0, m);
                    return next;
                  });
                  dragCol.current = null;
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="size-4 cursor-grab text-slate-400" />
                  <Input
                    value={col.title}
                    onChange={(e) => patchCol(ci, { title: e.target.value })}
                    className="h-8 flex-1 font-medium"
                    placeholder="Column heading"
                  />
                  <button
                    type="button"
                    onClick={() => setColumns((c) => c.filter((_, i) => i !== ci))}
                    className="text-slate-400 hover:text-red-600"
                    aria-label="Remove column"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-2 space-y-1.5 pl-6">
                  {col.links.map((link, li) => (
                    <div key={li} className="flex items-center gap-1.5">
                      <Input
                        value={link.label}
                        onChange={(e) => patchLink(ci, li, { label: e.target.value })}
                        placeholder="Label"
                        className="h-7 text-xs"
                      />
                      <Input
                        value={link.href}
                        onChange={(e) => patchLink(ci, li, { href: e.target.value })}
                        placeholder="/path or https://"
                        className="h-7 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          patchCol(ci, {
                            links: col.links.filter((_, j) => j !== li),
                          })
                        }
                        className="text-slate-400 hover:text-red-600"
                        aria-label="Remove link"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      patchCol(ci, {
                        links: [...col.links, { label: "New link", href: "/" }],
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline"
                  >
                    <Plus className="size-3" /> Add link
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() =>
              setColumns((c) => [...c, { title: "New column", links: [] }])
            }
          >
            <Plus className="size-4" /> Add column
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="mb-3 text-sm font-semibold">Text</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bottomText">Bottom line ({"{year}"} is replaced)</Label>
              <Input
                id="bottomText"
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ---- style + preview ---- */}
      <aside className="space-y-5">
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="mb-3 text-sm font-semibold">Colours</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {PALETTES.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  setBg(p.bg);
                  setText(p.text);
                  setHeading(p.heading);
                  setLink(p.link);
                }}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs dark:border-slate-700"
                style={{ background: p.bg, color: p.heading }}
              >
                {p.name}
              </button>
            ))}
          </div>
          {(
            [
              ["Background", bgColor, setBg],
              ["Body text", textColor, setText],
              ["Headings", headingColor, setHeading],
              ["Links", linkColor, setLink],
            ] as const
          ).map(([label, val, set]) => (
            <div key={label} className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">{label}</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="h-7 w-9 rounded border"
                />
                <Input
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="h-7 w-24 text-xs"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="mb-3 text-sm font-semibold">Layout</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cc">Columns</Label>
              <Select
                id="cc"
                value={String(columnsCount)}
                onChange={(e) => setCount(Number(e.target.value))}
              >
                {[2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="al">Alignment</Label>
              <Select
                id="al"
                value={align}
                onChange={(e) => setAlign(e.target.value as FooterConfig["align"])}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
              </Select>
            </div>
          </div>
        </div>

        <SubmitBtn />
      </aside>

      {/* ---- live preview (full width) ---- */}
      <div className="lg:col-span-2">
        <p className="mb-2 text-sm font-semibold">Live preview</p>
        <div
          className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
          style={{ background: bgColor, color: textColor }}
        >
          <div
            className="mx-auto grid max-w-5xl gap-8 px-6 py-10"
            style={{
              gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))`,
              textAlign: align,
            }}
          >
            <div style={{ gridColumn: align === "center" ? `span ${columnsCount}` : undefined }}>
              <p className="font-bold" style={{ color: headingColor }}>
                Brand
              </p>
              <p className="mt-2 text-sm">{tagline}</p>
            </div>
            {columns.slice(0, columnsCount - (align === "center" ? 0 : 1)).map((col, i) => (
              <div key={i}>
                <p className="text-sm font-semibold" style={{ color: headingColor }}>
                  {col.title}
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {col.links.map((l, j) => (
                    <li key={j} style={{ color: linkColor }}>
                      {l.label}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div
            className="border-t py-5 text-center text-xs"
            style={{ borderColor: `${textColor}33` }}
          >
            {bottomText.replace("{year}", String(new Date().getFullYear()))}
          </div>
        </div>
      </div>
    </form>
  );
}
