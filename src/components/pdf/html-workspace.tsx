"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";
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

export function HtmlWorkspace({ slug }: { slug: string }) {
  const [html, setHtml] = useState(SAMPLE);
  const [orientation, setOrientation] = useState("portrait");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OpFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!html.trim()) return;
    setBusy(true);
    setError(null);
    const started = performance.now();
    try {
      const res = await htmlToPdf(html, { orientation });
      setResult(res.files);
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
      setError(err instanceof Error ? err.message : "Rendering failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      {result ? (
        <DownloadList files={result} />
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="html">HTML source</Label>
            <Textarea
              id="html"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="min-h-[240px] font-mono text-xs"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
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
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button size="lg" onClick={run} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : "Render to PDF"}
          </Button>
          <p className="text-xs text-slate-400">
            Paste HTML source. Fetching a live URL is blocked by browser
            cross-origin rules — copy the page source instead.
          </p>
        </div>
      )}
    </div>
  );
}
