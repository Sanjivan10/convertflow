"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { track, logConversion } from "@/lib/track";
import { htmlToPdf, type OpFile } from "@/lib/pdf/ops";
import { DownloadList } from "./download-list";

const SAMPLE = `<h1>Invoice #1024</h1>
<p><strong>Billed to:</strong> Acme Corp</p>
<table border="1" cellpadding="6" style="border-collapse:collapse">
  <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
  <tr><td>Design work</td><td>10</td><td>$1,200</td></tr>
  <tr><td>Hosting</td><td>1</td><td>$90</td></tr>
</table>`;

export function HtmlWorkspace({
  slug,
  conversionConfigured = false,
}: {
  slug: string;
  conversionConfigured?: boolean;
}) {
  const [mode, setMode] = useState<"html" | "url">("html");
  const [html, setHtml] = useState(SAMPLE);
  const [url, setUrl] = useState("");
  const [orientation, setOrientation] = useState("portrait");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OpFile[] | null>(null);
  const [downloadResult, setDownloadResult] = useState<{
    href: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runHtml = async () => {
    if (!html.trim()) return;
    setBusy(true);
    setError(null);
    const started = performance.now();
    try {
      const res = await htmlToPdf(html, { orientation });
      setResult(res.files);
      toast("PDF ready.", "success");
      track({ type: "CONVERSION", path: `/convert/${slug}`, toolSlug: slug });
      logConversion({
        toolSlug: slug,
        fromFormat: "html",
        toFormat: "pdf",
        fileSize: html.length,
        durationMs: Math.round(performance.now() - started),
        success: true,
      });
    } catch (err) {
      const m = err instanceof Error ? err.message : "Rendering failed.";
      setError(m);
      toast(m, "error");
    } finally {
      setBusy(false);
    }
  };

  const runUrl = async () => {
    const u = url.trim();
    if (!u) return;
    setBusy(true);
    setError(null);
    const started = performance.now();
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 120_000);
    try {
      const body = new FormData();
      body.set("op", "html-to-pdf");
      body.set("url", u);
      const res = await fetch("/api/convert/document", {
        method: "POST",
        body,
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Conversion failed (${res.status}).`);
      }
      const blob = await res.blob();
      setDownloadResult({
        href: URL.createObjectURL(blob),
        name: "webpage.pdf",
      });
      toast("PDF ready.", "success");
      track({ type: "CONVERSION", path: `/convert/${slug}`, toolSlug: slug });
      logConversion({
        toolSlug: slug,
        fromFormat: "url",
        toFormat: "pdf",
        durationMs: Math.round(performance.now() - started),
        success: true,
      });
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      const m = aborted
        ? "The page took too long to render."
        : err instanceof Error
          ? err.message
          : "Conversion failed.";
      setError(m);
      toast(m, "error");
    } finally {
      clearTimeout(to);
      setBusy(false);
    }
  };

  const reset = () => {
    if (downloadResult) URL.revokeObjectURL(downloadResult.href);
    setResult(null);
    setDownloadResult(null);
    setError(null);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      {result || downloadResult ? (
        <div className="space-y-3">
          {result && <DownloadList files={result} />}
          {downloadResult && (
            <a
              href={downloadResult.href}
              download={downloadResult.name}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-medium text-white hover:bg-sky-700"
            >
              Download {downloadResult.name}
            </a>
          )}
          <div>
            <Button variant="outline" size="sm" onClick={reset}>
              Convert another
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setMode("html")}
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                mode === "html"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              Paste HTML
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                mode === "url"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              From a URL
            </button>
          </div>

          {mode === "html" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="html">HTML source</Label>
                <Textarea
                  id="html"
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  className="min-h-[220px] font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5 sm:max-w-xs">
                <Label htmlFor="orient">Orientation</Label>
                <Select
                  id="orient"
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </Select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button size="lg" onClick={runHtml} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : "Render to PDF"}
              </Button>
              <p className="text-xs text-slate-400">
                Rendered in your browser. For a live web page, switch to the
                &ldquo;From a URL&rdquo; tab.
              </p>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="url">Web page URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {conversionConfigured ? (
                <Button size="lg" onClick={runUrl} disabled={busy || !url.trim()}>
                  {busy ? (
                    <>
                      <Loader2 className="animate-spin" /> Rendering…
                    </>
                  ) : (
                    "Convert URL to PDF"
                  )}
                </Button>
              ) : (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  URL rendering runs on the server and needs a conversion service
                  configured (<code>CONVERSION_PROVIDER</code> +{" "}
                  <code>CONVERSION_API_KEY</code>). The &ldquo;Paste HTML&rdquo;
                  tab works with no setup.
                </p>
              )}
              <p className="text-xs text-slate-400">
                The server fetches the page, renders it with a headless browser,
                and returns a PDF. Private/localhost addresses are rejected.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
