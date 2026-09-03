"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import type { FaqItem } from "@/lib/seo";

/**
 * Edits an array of { question, answer } and mirrors it into a hidden input
 * named `faq` (JSON) so it posts with the surrounding <form>.
 */
export function FaqBuilder({ initial }: { initial: FaqItem[] }) {
  const [items, setItems] = useState<FaqItem[]>(initial);

  const update = (i: number, patch: Partial<FaqItem>) =>
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    );

  return (
    <div className="space-y-3">
      <input type="hidden" name="faq" value={JSON.stringify(items)} />
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
        >
          <div className="flex items-center justify-between">
            <Label>Question {i + 1}</Label>
            <button
              type="button"
              onClick={() => setItems(items.filter((_, idx) => idx !== i))}
              className="text-slate-400 hover:text-red-600"
              aria-label="Remove question"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <Input
            className="mt-1"
            value={item.question}
            onChange={(e) => update(i, { question: e.target.value })}
            placeholder="How do I…?"
          />
          <Textarea
            className="mt-2"
            value={item.answer}
            onChange={(e) => update(i, { answer: e.target.value })}
            placeholder="Answer shown in the FAQ section and FAQPage schema."
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setItems([...items, { question: "", answer: "" }])}
      >
        <Plus className="size-4" /> Add question
      </Button>
    </div>
  );
}
