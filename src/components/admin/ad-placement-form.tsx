"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import {
  deleteAdPlacement,
  saveAdPlacement,
} from "@/app/admin/(protected)/ads-actions";
import type { AdPlacementView } from "@/lib/ads";

function SaveBtn({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
      {isNew ? "Create placement" : "Save"}
    </Button>
  );
}

export function AdPlacementForm({
  placement,
  zones,
}: {
  placement?: AdPlacementView;
  zones: { id: string; label: string; suggested: string }[];
}) {
  const isNew = !placement;
  const [kind, setKind] = useState<"image" | "html" | "adsense">(
    placement?.htmlSnippet
      ? "html"
      : placement?.adsenseSlot
        ? "adsense"
        : "image",
  );

  return (
    <form
      action={saveAdPlacement}
      className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
    >
      {placement && <input type="hidden" name="id" value={placement.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`name-${placement?.id ?? "new"}`}>Name</Label>
          <Input
            id={`name-${placement?.id ?? "new"}`}
            name="name"
            defaultValue={placement?.name ?? ""}
            placeholder="Summer promo banner"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`zone-${placement?.id ?? "new"}`}>Zone (position on site)</Label>
          <Select
            id={`zone-${placement?.id ?? "new"}`}
            name="zone"
            defaultValue={placement?.zone ?? zones[0]?.id}
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`fmt-${placement?.id ?? "new"}`}>Reserved size</Label>
          <Select
            id={`fmt-${placement?.id ?? "new"}`}
            name="format"
            defaultValue={placement?.format ?? "leaderboard"}
          >
            <option value="leaderboard">Leaderboard (banner)</option>
            <option value="rectangle">Rectangle</option>
            <option value="sidebar">Sidebar (tall)</option>
            <option value="mobile-banner">Mobile banner</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`pos-${placement?.id ?? "new"}`}>Order</Label>
          <Input
            id={`pos-${placement?.id ?? "new"}`}
            name="position"
            type="number"
            defaultValue={placement?.position ?? 0}
          />
        </div>
      </div>

      <div className="flex gap-1.5">
        {(["image", "html", "adsense"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded px-2.5 py-1 text-xs font-medium capitalize ${
              kind === k
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {k === "adsense" ? "AdSense slot" : k}
          </button>
        ))}
      </div>

      {kind === "image" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <ImageUploadField
            name="imageUrl"
            label="Banner image"
            defaultValue={placement?.imageUrl ?? ""}
          />
          <div className="space-y-1.5">
            <Label htmlFor={`tgt-${placement?.id ?? "new"}`}>Click-through URL</Label>
            <Input
              id={`tgt-${placement?.id ?? "new"}`}
              name="targetUrl"
              defaultValue={placement?.targetUrl ?? ""}
              placeholder="https://advertiser.example"
            />
          </div>
        </div>
      )}
      {kind === "html" && (
        <div className="space-y-1.5">
          <Label htmlFor={`html-${placement?.id ?? "new"}`}>HTML / embed code</Label>
          <Textarea
            id={`html-${placement?.id ?? "new"}`}
            name="htmlSnippet"
            defaultValue={placement?.htmlSnippet ?? ""}
            className="min-h-[100px] font-mono text-xs"
            placeholder="<script>…</script> or <iframe …>"
          />
        </div>
      )}
      {kind === "adsense" && (
        <div className="space-y-1.5">
          <Label htmlFor={`slot-${placement?.id ?? "new"}`}>AdSense ad-unit slot id</Label>
          <Input
            id={`slot-${placement?.id ?? "new"}`}
            name="adsenseSlot"
            defaultValue={placement?.adsenseSlot ?? ""}
            placeholder="1234567890"
          />
          <p className="text-xs text-slate-400">
            Requires NEXT_PUBLIC_ADSENSE_CLIENT to be set.
          </p>
        </div>
      )}
      {/* keep the non-selected inputs present but empty so switching kind clears them */}
      {kind !== "image" && <input type="hidden" name="imageUrl" value="" />}
      {kind !== "image" && <input type="hidden" name="targetUrl" value="" />}
      {kind !== "html" && <input type="hidden" name="htmlSnippet" value="" />}
      {kind !== "adsense" && <input type="hidden" name="adsenseSlot" value="" />}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={placement?.enabled ?? true}
          className="size-4 accent-sky-600"
        />
        Enabled (visible on the live site)
      </label>

      <div className="flex items-center gap-2">
        <SaveBtn isNew={isNew} />
        {placement && (
          <Button
            type="submit"
            formAction={deleteAdPlacement}
            variant="ghost"
            size="sm"
            className="text-red-600"
          >
            <Trash2 className="size-4" /> Delete
          </Button>
        )}
      </div>
    </form>
  );
}
