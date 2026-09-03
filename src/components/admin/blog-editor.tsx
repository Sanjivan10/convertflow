"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { FaqBuilder } from "@/components/admin/faq-builder";
import { KeywordsField } from "@/components/admin/keywords-field";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { slugify } from "@/lib/utils";
import { savePost, deletePost } from "@/app/admin/(protected)/actions";
import type { PostView } from "@/lib/blog";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Save className="size-4" />}
      Save post
    </Button>
  );
}

export function BlogEditor({ post }: { post?: PostView }) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
  const [contentHtml, setContentHtml] = useState(post?.contentHtml ?? "");

  return (
    <form action={savePost} className="grid gap-6 lg:grid-cols-3">
      {post?.id && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="contentHtml" value={contentHtml} />

      <div className="space-y-6 lg:col-span-2">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            name="excerpt"
            defaultValue={post?.excerpt ?? ""}
            placeholder="One or two sentences shown on the blog index and as a meta-description fallback."
          />
        </div>

        <div className="space-y-1.5">
          <Label>Content</Label>
          <RichTextEditor value={contentHtml} onChange={setContentHtml} />
        </div>

        <div className="space-y-1.5">
          <Label>FAQ (renders as FAQPage schema)</Label>
          <FaqBuilder initial={post?.faq ?? []} />
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              name="status"
              defaultValue={post?.status ?? "DRAFT"}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </Select>
          </div>
          <div className="mt-4">
            <SubmitButton />
          </div>
          {post?.id && (
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer text-red-600">
                Danger zone
              </summary>
              <div className="mt-2">
                <Button
                  type="submit"
                  formAction={deletePost}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="size-4" /> Delete post
                </Button>
              </div>
            </details>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
            />
            <p className="text-xs text-slate-400">/blog/{slug || "…"}</p>
          </div>
          <ImageUploadField
            name="coverImage"
            label="Featured image"
            defaultValue={post?.coverImage ?? ""}
            hint="Used as the OpenGraph / social share image."
          />
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              name="tags"
              defaultValue={post?.tags.join(", ") ?? ""}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-sm font-semibold">SEO</p>
          <KeywordsField name="keywords" initial={post?.keywords ?? []} />
          <div className="space-y-1.5">
            <Label htmlFor="metaTitle">Meta title</Label>
            <Input
              id="metaTitle"
              name="metaTitle"
              defaultValue={post?.metaTitle ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="metaDescription">Meta description</Label>
            <Textarea
              id="metaDescription"
              name="metaDescription"
              defaultValue={post?.metaDescription ?? ""}
            />
          </div>
        </div>
      </aside>
    </form>
  );
}
