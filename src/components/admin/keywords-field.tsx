"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Label } from "@/components/ui/input";

/**
 * SEO keyword editor. Renders chips and mirrors the list into a hidden input
 * (JSON array) named `name` so it posts with the surrounding form.
 */
export function KeywordsField({
  name,
  label = "Focus keywords",
  initial = [],
  hint = "Terms this page should rank for. Press Enter or comma to add.",
}: {
  name: string;
  label?: string;
  initial?: string[];
  hint?: string;
}) {
  const [tags, setTags] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const value = raw.trim().toLowerCase();
    if (value && !tags.includes(value)) setTags([...tags, value]);
    setDraft("");
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`kw-${name}`}>{label}</Label>
      <input type="hidden" name={name} value={JSON.stringify(tags)} />

      <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-300 p-2 dark:border-slate-700">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-950 dark:text-sky-300"
          >
            {tag}
            <button
              type="button"
              onClick={() => setTags(tags.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={`kw-${name}`}
          value={draft}
          onChange={(e) => {
            if (e.target.value.includes(",")) add(e.target.value.replace(",", ""));
            else setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && tags.length) {
              setTags(tags.slice(0, -1));
            }
          }}
          onBlur={() => draft && add(draft)}
          placeholder={tags.length ? "" : "png to webp, image compression…"}
          className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      <p className="text-xs text-slate-400">{hint}</p>
    </div>
  );
}
