"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { FaqBuilder } from "@/components/admin/faq-builder";
import { KeywordsField } from "@/components/admin/keywords-field";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { slugify } from "@/lib/utils";
import { saveTool, deleteTool } from "@/app/admin/(protected)/actions";
import type { ToolView } from "@/lib/tools";

const CUSTOM_TEMPLATE = `// Runs in the visitor's browser. Define convert(files, options, helpers).
// Return { name, blob } or an array of them.
async function convert(files, options, helpers) {
  const file = files[0];
  const text = await helpers.readText(file);
  const upper = text.toUpperCase();
  return {
    name: file.name.replace(/\\.[^.]+$/, "") + ".txt",
    blob: helpers.makeBlob([upper], "text/plain"),
  };
}`;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Save className="size-4" />}
      Save tool
    </Button>
  );
}

export function ToolForm({ tool }: { tool?: ToolView }) {
  const [name, setName] = useState(tool?.name ?? "");
  const [slug, setSlug] = useState(tool?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(tool?.slug));
  const [engine, setEngine] = useState(tool?.engine ?? "IMAGE");

  return (
    <form action={saveTool} className="grid gap-6 lg:grid-cols-3">
      {tool?.id && <input type="hidden" name="id" value={tool.id} />}

      <div className="space-y-6 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Tool name</Label>
            <Input
              id="name"
              name="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="AVIF to PNG Converter"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              name="category"
              defaultValue={tool?.category ?? "image"}
              placeholder="image / pdf / document"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fromFormat">From format</Label>
            <Input
              id="fromFormat"
              name="fromFormat"
              required
              defaultValue={tool?.fromFormat ?? ""}
              placeholder="AVIF"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="toFormat">To format</Label>
            <Input
              id="toFormat"
              name="toFormat"
              required
              defaultValue={tool?.toFormat ?? ""}
              placeholder="PNG"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Short description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={tool?.description ?? ""}
            placeholder="Shown on cards and used as the meta-description fallback."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="longDescription">
            About this tool (HTML allowed)
          </Label>
          <Textarea
            id="longDescription"
            name="longDescription"
            className="min-h-[140px] font-mono text-xs"
            defaultValue={tool?.longDescription ?? ""}
            placeholder="<p>Explain the format difference, use cases, quality notes…</p>"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="engine">Conversion engine</Label>
            <Select
              id="engine"
              name="engine"
              value={engine}
              onChange={(e) =>
                setEngine(e.target.value as ToolView["engine"])
              }
            >
              <option value="IMAGE">Image (Canvas API)</option>
              <option value="PDF">PDF (pdf-lib)</option>
              <option value="CUSTOM">Custom script</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accept">Accept attribute</Label>
            <Input
              id="accept"
              name="accept"
              defaultValue={tool?.accept ?? ""}
              placeholder="image/avif,.avif"
            />
          </div>
        </div>

        {engine === "CUSTOM" && (
          <div className="space-y-1.5">
            <Label htmlFor="customScript">
              Custom converter script (runs client-side)
            </Label>
            <Textarea
              id="customScript"
              name="customScript"
              className="min-h-[220px] font-mono text-xs"
              defaultValue={tool?.customScript || CUSTOM_TEMPLATE}
            />
            <p className="text-xs text-amber-600">
              This code executes in every visitor&apos;s browser. Only paste
              logic you trust.
            </p>
          </div>
        )}
        {engine !== "CUSTOM" && (
          <input
            type="hidden"
            name="customScript"
            value={tool?.customScript ?? ""}
          />
        )}

        <div className="space-y-1.5">
          <Label>FAQ (renders as FAQPage schema)</Label>
          <FaqBuilder initial={tool?.faq ?? []} />
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              name="status"
              defaultValue={tool?.status ?? "DRAFT"}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </Select>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={tool?.featured}
              className="size-4 accent-sky-600"
            />
            Feature on homepage
          </label>
          <div className="mt-4">
            <SubmitButton />
          </div>
          {tool?.id && (
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer text-red-600">
                Danger zone
              </summary>
              <div className="mt-2">
                <Button
                  type="submit"
                  formAction={deleteTool}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="size-4" /> Delete tool
                </Button>
              </div>
            </details>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="space-y-1.5">
            <Label htmlFor="slug">Route slug</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
            />
            <p className="text-xs text-slate-400">/convert/{slug || "…"}</p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-sm font-semibold">SEO</p>
          <KeywordsField name="keywords" initial={tool?.keywords ?? []} />
          <div className="space-y-1.5">
            <Label htmlFor="metaTitle">Meta title</Label>
            <Input
              id="metaTitle"
              name="metaTitle"
              defaultValue={tool?.metaTitle ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="metaDescription">Meta description</Label>
            <Textarea
              id="metaDescription"
              name="metaDescription"
              defaultValue={tool?.metaDescription ?? ""}
            />
          </div>
          <ImageUploadField
            name="ogImage"
            label="Hero / OpenGraph image"
            defaultValue={tool?.ogImage ?? ""}
            hint="Optional. Shown on social shares of this tool page."
          />
        </div>
      </aside>
    </form>
  );
}
