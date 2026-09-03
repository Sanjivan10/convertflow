"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/dropzone";
import { Input, Label, Select } from "@/components/ui/input";
import { track, logConversion } from "@/lib/track";
import {
  fillForm,
  readFormFields,
  type FormFieldInfo,
  type OpFile,
} from "@/lib/pdf/ops";
import { DownloadList } from "./download-list";

export function FormsWorkspace({ slug }: { slug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FormFieldInfo[] | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [flatten, setFlatten] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OpFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async (f: File) => {
    setFile(f);
    setError(null);
    setResult(null);
    try {
      const detected = await readFormFields(f);
      setFields(detected);
      setValues(
        Object.fromEntries(detected.map((d) => [d.name, d.value])),
      );
      if (detected.length === 0)
        setError("No interactive form fields were found in this PDF.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read the form.");
    }
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    const started = performance.now();
    try {
      const res = await fillForm(file, values, flatten);
      setResult(res.files);
      track({ type: "CONVERSION", path: `/tools/${slug}`, toolSlug: slug });
      logConversion({
        toolSlug: slug,
        fromFormat: "forms",
        toFormat: "pdf",
        fileName: file.name,
        fileSize: file.size,
        durationMs: Math.round(performance.now() - started),
        success: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fill the form.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      {!file && (
        <Dropzone
          accept="application/pdf,.pdf"
          multiple={false}
          onFiles={(f) => load(f[0])}
        />
      )}

      {error && <p className="mt-3 text-sm text-amber-600">{error}</p>}

      {result ? (
        <div className="mt-4">
          <DownloadList files={result} />
        </div>
      ) : (
        fields &&
        fields.length > 0 && (
          <div className="mt-4 space-y-4">
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {fields.map((field) => (
                <div key={field.name} className="space-y-1">
                  <Label htmlFor={`f-${field.name}`}>
                    {field.name}{" "}
                    <span className="text-xs text-slate-400">({field.type})</span>
                  </Label>
                  {field.type === "checkbox" ? (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        id={`f-${field.name}`}
                        type="checkbox"
                        checked={values[field.name] === "true"}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            [field.name]: e.target.checked ? "true" : "false",
                          }))
                        }
                        className="size-4 accent-sky-600"
                      />
                      Checked
                    </label>
                  ) : field.options && field.options.length > 0 ? (
                    <Select
                      id={`f-${field.name}`}
                      value={values[field.name] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [field.name]: e.target.value }))
                      }
                    >
                      <option value="">—</option>
                      {field.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      id={`f-${field.name}`}
                      value={values[field.name] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [field.name]: e.target.value }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={flatten}
                onChange={(e) => setFlatten(e.target.checked)}
                className="size-4 accent-sky-600"
              />
              Flatten form (values become permanent, fields no longer editable)
            </label>

            <div className="flex gap-2">
              <Button size="lg" onClick={run} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : "Export PDF"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setFile(null);
                  setFields(null);
                }}
              >
                Choose another file
              </Button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
