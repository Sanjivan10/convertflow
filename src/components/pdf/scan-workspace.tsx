"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track, logConversion } from "@/lib/track";
import { imagesToPdf, type OpFile } from "@/lib/pdf/ops";
import { DownloadList } from "./download-list";

export function ScanWorkspace({ slug }: { slug: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [shots, setShots] = useState<{ url: string; blob: Blob }[]>([]);
  const [docFilter, setDocFilter] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OpFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  };

  useEffect(() => () => stop(), []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      setError(
        "Camera access was denied or is unavailable. You can still use JPG to PDF to upload photos.",
      );
    }
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    if (docFilter) {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.data.length; i += 4) {
        const g =
          0.3 * data.data[i] + 0.59 * data.data[i + 1] + 0.11 * data.data[i + 2];
        const v = Math.min(255, Math.max(0, (g - 128) * 1.4 + 140));
        data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
      }
      ctx.putImageData(data, 0, 0);
    }
    const blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!), "image/jpeg", 0.9),
    );
    setShots((s) => [...s, { url: URL.createObjectURL(blob), blob }]);
  };

  const build = async () => {
    if (shots.length === 0) return;
    setBusy(true);
    setError(null);
    const started = performance.now();
    try {
      const files = shots.map(
        (s, i) => new File([s.blob], `scan-${i + 1}.jpg`, { type: "image/jpeg" }),
      );
      const res = await imagesToPdf(files, { pageSize: "a4", margin: 8 });
      setResult(res.files);
      stop();
      track({ type: "CONVERSION", path: `/tools/${slug}`, toolSlug: slug });
      logConversion({
        toolSlug: slug,
        fromFormat: "scan",
        toFormat: "pdf",
        fileSize: shots.reduce((a, s) => a + s.blob.size, 0),
        durationMs: Math.round(performance.now() - started),
        success: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build the PDF.");
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
          <div className="relative overflow-hidden rounded-xl bg-slate-900">
            <video
              ref={videoRef}
              playsInline
              muted
              className="mx-auto max-h-[420px] w-full object-contain"
            />
            {!streaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                <Camera className="size-10 opacity-70" />
                <Button onClick={startCamera}>Enable camera</Button>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-amber-600">{error}</p>}

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={docFilter}
              onChange={(e) => setDocFilter(e.target.checked)}
              className="size-4 accent-sky-600"
            />
            Apply document filter (grayscale + contrast)
          </label>

          {shots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {shots.map((s, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.url}
                    alt={`Scan ${i + 1}`}
                    className="h-24 w-20 rounded border border-slate-200 object-cover dark:border-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShots((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 p-0.5 text-white"
                    aria-label="Remove"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={capture} disabled={!streaming}>
              <Camera /> Capture page
            </Button>
            <Button
              variant="secondary"
              onClick={build}
              disabled={busy || shots.length === 0}
            >
              {busy ? <Loader2 className="animate-spin" /> : `Build PDF (${shots.length})`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
