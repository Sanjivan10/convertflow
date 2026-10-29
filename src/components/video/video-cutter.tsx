"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Film, Loader2, Pause, Play, RotateCcw, Scissors, X } from "lucide-react";
import { Dropzone } from "@/components/dropzone";
import { logConversion, trackClick } from "@/lib/track";
import { cn, formatBytes } from "@/lib/utils";

type Mode = "fast" | "exact";
type Output = "video" | "audio";
type Mb = typeof import("mediabunny");

const ACCEPT = "video/*,.mp4,.mov,.m4v,.webm,.mkv";

/** 3725.4 → "1:02:05.4" */
export function formatTime(t: number, decimals = 1): string {
  if (!Number.isFinite(t) || t < 0) t = 0;
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const ss = decimals ? s.toFixed(decimals).padStart(decimals + 3, "0") : String(Math.floor(s)).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** "1:01:00" | "61:00" | "90" | "1:30.5" → seconds, or NaN. */
export function parseTime(v: string): number {
  const parts = v.trim().replace(",", ".").split(":");
  if (parts.length > 3 || parts.some((p) => p === "" || isNaN(Number(p)))) return NaN;
  return parts.reduce((acc, p) => acc * 60 + Number(p), 0);
}

type Loaded = {
  file: File;
  url: string;
  input: InstanceType<Mb["Input"]>;
  duration: number;
  mime: string;
  hasVideo: boolean;
};

function outputFor(mb: Mb, mime: string, output: Output) {
  if (output === "audio") return { format: new mb.Mp4OutputFormat(), ext: "m4a", type: "audio/mp4" };
  if (mime.includes("webm")) return { format: new mb.WebMOutputFormat(), ext: "webm", type: "video/webm" };
  if (mime.includes("matroska")) return { format: new mb.MkvOutputFormat(), ext: "mkv", type: "video/x-matroska" };
  if (mime.includes("quicktime")) return { format: new mb.MovOutputFormat(), ext: "mov", type: "video/quicktime" };
  return { format: new mb.Mp4OutputFormat(), ext: "mp4", type: "video/mp4" };
}

function TimeField({
  label,
  value,
  max,
  onChange,
  onUseCurrent,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (t: number) => void;
  onUseCurrent: () => void;
}) {
  // While typing, show the raw text; otherwise show the formatted value.
  const [editing, setEditing] = useState<string | null>(null);
  const [bad, setBad] = useState(false);
  const text = editing ?? formatTime(value);

  const commit = () => {
    if (editing === null) return;
    const t = parseTime(editing);
    if (Number.isFinite(t) && t >= 0 && t <= max) {
      onChange(t);
      setEditing(null);
      setBad(false);
    } else setBad(true);
  };

  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</label>
      <div className="mt-1.5 flex items-center gap-1.5">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="h-10 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700" aria-label={`${label} minus 1 second`}>
          −1s
        </button>
        <input
          value={text}
          onChange={(e) => setEditing(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          inputMode="decimal"
          aria-label={`${label} time`}
          className={cn(
            "h-10 w-full min-w-0 rounded-lg border px-3 text-center font-mono text-base dark:bg-slate-900",
            bad ? "border-red-400" : "border-slate-200 dark:border-slate-700",
          )}
        />
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="h-10 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700" aria-label={`${label} plus 1 second`}>
          +1s
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} slider`}
        className="mt-2 w-full accent-sky-600"
      />
      <button type="button" onClick={onUseCurrent} className="mt-1 text-xs font-medium text-sky-600 hover:underline">
        Use current video time
      </button>
      {bad && <p className="text-xs text-red-600">Use h:mm:ss, mm:ss or seconds, within the video length.</p>}
    </div>
  );
}

export function VideoCutter({ slug }: { slug: string }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [mode, setMode] = useState<Mode>("fast");
  const [output, setOutput] = useState<Output>("video");
  const [progress, setProgress] = useState<number | null>(null);
  const [playable, setPlayable] = useState(true);
  const [previewing, setPreviewing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mbRef = useRef<Mb | null>(null);
  const convRef = useRef<{ cancel: () => Promise<void> } | null>(null);

  // Release the object URL when the file changes.
  useEffect(() => () => {
    if (loaded) URL.revokeObjectURL(loaded.url);
  }, [loaded]);

  const open = useCallback(async (file: File) => {
    setOpening(true);
    setError("");
    try {
      const mb = mbRef.current ?? (mbRef.current = await import("mediabunny"));
      const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
      const [duration, format, videoTrack] = await Promise.all([
        input.computeDuration(),
        input.getFormat(),
        input.getPrimaryVideoTrack(),
      ]);
      if (!Number.isFinite(duration) || duration <= 0) throw new Error("no duration");
      setPlayable(true);
      setLoaded({ file, url: URL.createObjectURL(file), input, duration, mime: format.mimeType, hasVideo: Boolean(videoTrack) });
      setStart(0);
      setEnd(Math.min(duration, 30));
      setOutput(videoTrack ? "video" : "audio");
    } catch {
      setError("This file couldn't be opened. Try an MP4, MOV, WebM or MKV video.");
    } finally {
      setOpening(false);
    }
  }, []);

  const clipLen = Math.max(0, end - start);
  const estSize = loaded ? (loaded.file.size * clipLen) / loaded.duration : 0;
  const valid = loaded && clipLen >= 0.1;

  function setStartSafe(t: number) {
    setStart(t);
    if (t >= end && loaded) setEnd(Math.min(loaded.duration, t + 1));
  }
  function setEndSafe(t: number) {
    setEnd(t);
    if (t <= start) setStart(Math.max(0, t - 1));
  }

  function preview() {
    const v = videoRef.current;
    if (!v) return;
    if (previewing) {
      v.pause();
      setPreviewing(false);
      return;
    }
    v.currentTime = start;
    void v.play();
    setPreviewing(true);
  }

  function onTimeUpdate() {
    const v = videoRef.current;
    if (previewing && v && v.currentTime >= end) {
      v.pause();
      setPreviewing(false);
    }
  }

  async function cut() {
    if (!loaded || !mbRef.current) return;
    const mb = mbRef.current;
    setError("");
    setProgress(0);
    const t0 = performance.now();
    try {
      const out = outputFor(mb, loaded.mime, output);
      const target = new mb.BufferTarget();
      const result = new mb.Output({ format: out.format, target });
      const conversion = await mb.Conversion.init({
        input: loaded.input,
        output: result,
        trim: { start, end },
        copy: mode === "fast" ? {} : false,
        video: output === "audio" ? { discard: true } : undefined,
        showWarnings: false,
      });
      if (!conversion.isValid) throw new Error("unsupported");
      convRef.current = conversion;
      conversion.onProgress = (p) => setProgress(p);
      await conversion.execute();
      const buffer = target.buffer;
      if (!buffer) throw new Error("empty");

      const base = loaded.file.name.replace(/\.[^.]+$/, "") || "video";
      const stamp = `${formatTime(start, 0)}-${formatTime(end, 0)}`.replace(/:/g, "-");
      const blob = new Blob([buffer], { type: out.type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}-clip-${stamp}.${out.ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);

      logConversion({
        toolSlug: slug,
        fromFormat: (loaded.file.name.split(".").pop() || "video").toUpperCase(),
        toFormat: out.ext.toUpperCase(),
        fileName: loaded.file.name,
        fileSize: blob.size,
        durationMs: Math.round(performance.now() - t0),
        success: true,
      });
      trackClick(`video-cut:${slug}`, { mode, output, seconds: Math.round(clipLen) });
    } catch (e) {
      if (e instanceof Error && e.name === "ConversionCanceledError") {
        setError("Cut cancelled.");
      } else {
        setError(
          mode === "exact"
            ? "Exact mode isn't supported for this video in your browser. Try Fast mode, or use Chrome or Edge."
            : "Couldn't cut this video. Try Exact mode or a different file.",
        );
        logConversion({
          toolSlug: slug,
          fromFormat: (loaded.file.name.split(".").pop() || "video").toUpperCase(),
          toFormat: output === "audio" ? "M4A" : "CLIP",
          success: false,
          error: e instanceof Error ? e.message.slice(0, 200) : "error",
        });
      }
    } finally {
      convRef.current = null;
      setProgress(null);
    }
  }

  const chip = (active: boolean) =>
    cn(
      "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
      active
        ? "border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200"
        : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300",
    );
  const busy = progress !== null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950">
      {!loaded ? (
        <>
          <Dropzone accept={ACCEPT} multiple={false} onFiles={(f) => f[0] && open(f[0])} />
          <p className="mt-3 text-center text-sm text-slate-500">MP4, MOV, M4V, WebM or MKV — any length</p>
          {opening && (
            <p className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" /> Opening your video…
            </p>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <span className="flex min-w-0 items-center gap-2 text-sm">
              <Film className="size-4 shrink-0 text-sky-600" />
              <span className="truncate font-medium">{loaded.file.name}</span>
              <span className="shrink-0 text-slate-400">
                {formatTime(loaded.duration, 0)} · {formatBytes(loaded.file.size)}
              </span>
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => setLoaded(null)}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-slate-500 hover:text-sky-600 disabled:opacity-50"
            >
              <RotateCcw className="size-4" /> New video
            </button>
          </div>

          {loaded.hasVideo && (
            <div className="mt-4 overflow-hidden rounded-xl bg-black">
              {playable ? (
                <video
                  ref={videoRef}
                  src={loaded.url}
                  controls
                  playsInline
                  preload="metadata"
                  onTimeUpdate={onTimeUpdate}
                  onError={() => setPlayable(false)}
                  className="max-h-[360px] w-full"
                />
              ) : (
                <p className="p-6 text-center text-sm text-slate-300">
                  Your browser can’t preview this video format, but you can still cut it — type the times below.
                </p>
              )}
            </div>
          )}

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TimeField
              label="Start"
              value={start}
              max={loaded.duration}
              onChange={setStartSafe}
              onUseCurrent={() => videoRef.current && setStartSafe(videoRef.current.currentTime)}
            />
            <TimeField
              label="End"
              value={end}
              max={loaded.duration}
              onChange={setEndSafe}
              onUseCurrent={() => videoRef.current && setEndSafe(videoRef.current.currentTime)}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
            <span>
              Clip length: <strong>{formatTime(clipLen)}</strong>
              <span className="text-slate-400"> · about {formatBytes(estSize)}</span>
            </span>
            {loaded.hasVideo && playable && (
              <button type="button" onClick={preview} className="inline-flex items-center gap-1.5 font-medium text-sky-600 hover:underline">
                {previewing ? <Pause className="size-4" /> : <Play className="size-4" />}
                {previewing ? "Stop preview" : "Preview clip"}
              </button>
            )}
          </div>
          {estSize > 1.5e9 && (
            <p className="mt-2 text-xs text-amber-600">
              This is a very long clip. It’s built in your device’s memory, so use a computer if your phone struggles.
            </p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className="text-xs font-medium uppercase tracking-wide text-slate-500">Cut mode</legend>
              <div className="mt-2 grid gap-2">
                <button type="button" className={chip(mode === "fast")} onClick={() => setMode("fast")}>
                  <strong>Fast</strong> — instant, no quality loss
                  <span className="block text-xs text-slate-500">Starts at the nearest keyframe (can be a few seconds early)</span>
                </button>
                <button type="button" className={chip(mode === "exact")} onClick={() => setMode("exact")}>
                  <strong>Exact</strong> — frame-perfect start &amp; end
                  <span className="block text-xs text-slate-500">Re-encodes the clip, takes longer</span>
                </button>
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-xs font-medium uppercase tracking-wide text-slate-500">Save as</legend>
              <div className="mt-2 grid gap-2">
                <button type="button" disabled={!loaded.hasVideo} className={chip(output === "video")} onClick={() => setOutput("video")}>
                  <strong>Video clip</strong>
                  <span className="block text-xs text-slate-500">Same format as your file</span>
                </button>
                <button type="button" className={chip(output === "audio")} onClick={() => setOutput("audio")}>
                  <strong>Audio only (M4A)</strong>
                  <span className="block text-xs text-slate-500">Just the sound from this part</span>
                </button>
              </div>
            </fieldset>
          </div>

          {busy ? (
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Loader2 className="size-4 animate-spin text-sky-600" /> Cutting… {Math.round((progress ?? 0) * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => void convRef.current?.cancel()}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600"
                >
                  <X className="size-4" /> Cancel
                </button>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full bg-sky-600 transition-[width]" style={{ width: `${(progress ?? 0) * 100}%` }} />
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={!valid}
              onClick={cut}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-50"
            >
              <Scissors className="size-5" /> Cut &amp; Download {output === "audio" ? "audio" : "clip"}
              <Download className="size-4 opacity-70" />
            </button>
          )}
        </>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
