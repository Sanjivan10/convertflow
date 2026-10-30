"use client";

import { useState } from "react";
import { Captions, Download, Languages, Loader2, Undo2 } from "lucide-react";
import { trackClick } from "@/lib/track";
import { cn } from "@/lib/utils";
import {
  NEEDS_ACCURATE,
  SPOKEN_LANGS,
  TARGET_LANGS,
  WHISPER_MODELS,
  extractAudio16k,
  isModelLoaded,
  toSrt,
  toVtt,
  transcribe,
  translateCaptions,
  type Accuracy,
  type Caption,
} from "@/lib/video/captions";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Props = {
  slug: string;
  mb: any;
  input: any;
  start: number;
  end: number;
  baseName: string;
  captions: Caption[];
  onCaptions: (c: Caption[]) => void;
  burn: boolean;
  onBurn: (b: boolean) => void;
  disabled?: boolean;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const fmt = (t: number) => {
  const m = Math.floor(t / 60);
  const s = (t % 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
};

function save(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function CaptionPanel(p: Props) {
  const [lang, setLang] = useState("en");
  const [accuracy, setAccuracy] = useState<Accuracy>("standard");
  const [busy, setBusy] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [target, setTarget] = useState("ne");
  const [original, setOriginal] = useState<Caption[] | null>(null);
  const [note, setNote] = useState("");

  const clipLen = Math.max(0, p.end - p.start);
  const forced = NEEDS_ACCURATE.has(lang);
  const acc: Accuracy = forced ? "accurate" : accuracy;
  const model = WHISPER_MODELS[acc];
  const etaMin = Math.max(1, Math.round((clipLen * model.factor) / 60));
  const spokenCode = lang === "auto" ? "en" : lang;

  async function generate() {
    setError("");
    setNote("");
    setOriginal(null);
    const t0 = performance.now();
    try {
      setBusy("Reading the audio…");
      setProgress(null);
      const audio = await extractAudio16k(p.mb, p.input, p.start, p.end);
      const listening = `Listening… about ${etaMin} min for this clip`;
      const loaded = isModelLoaded("automatic-speech-recognition", model.id);
      setBusy(loaded ? listening : `Downloading speech model (${model.size}, one time)…`);
      const whisper = lang === "auto" ? null : SPOKEN_LANGS.find((l) => l.code === lang)?.whisper ?? null;
      const caps = await transcribe(audio, { language: whisper, accuracy: acc }, (d) => {
        if (d >= 1) {
          setProgress(null);
          setBusy(listening);
        } else {
          setBusy(`Downloading speech model (${model.size}, one time)…`);
          setProgress(d);
        }
      });
      if (!caps.length) throw new Error("No speech was found in this part of the video.");
      p.onCaptions(caps);
      trackClick(`captions:${p.slug}`, { lang, acc, seconds: Math.round(clipLen), ms: Math.round(performance.now() - t0) });
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn’t create captions. Try a shorter clip or the Standard model.");
    } finally {
      setBusy("");
      setProgress(null);
    }
  }

  async function translate() {
    if (!p.captions.length) return;
    setError("");
    setNote("");
    try {
      const base = original ?? p.captions;
      const { captions, engine } = await translateCaptions(base, spokenCode, target, (s, pr) => {
        setBusy(s);
        setProgress(pr ?? null);
      });
      setOriginal(base);
      p.onCaptions(captions);
      setNote(
        engine === "chrome"
          ? "Translated with your browser’s built-in translator."
          : "Translated with an in-browser AI model. Quality can be basic for some languages (e.g. Nepali) — please review and edit the lines.",
      );
      trackClick(`captions-translate:${p.slug}`, { from: spokenCode, to: target, engine });
    } catch {
      setError("Translation failed. Check your connection and try again.");
    } finally {
      setBusy("");
      setProgress(null);
    }
  }

  const select =
    "h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900";
  const label = "text-xs font-medium uppercase tracking-wide text-slate-500";
  const disabled = p.disabled || Boolean(busy);

  return (
    <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <p className="flex items-center gap-2 font-semibold">
        <Captions className="size-5 text-sky-600" /> Captions <span className="text-xs font-normal text-slate-400">(optional)</span>
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Auto-generate captions for this clip, edit them, translate them, and burn them into the video or download an SRT file.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Spoken language</span>
          <select className={cn(select, "mt-1.5")} value={lang} onChange={(e) => setLang(e.target.value)} disabled={disabled}>
            <option value="auto">Auto-detect</option>
            {SPOKEN_LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={label}>Accuracy</span>
          <select
            className={cn(select, "mt-1.5")}
            value={acc}
            onChange={(e) => setAccuracy(e.target.value as Accuracy)}
            disabled={disabled || forced}
          >
            <option value="standard">Standard — faster ({WHISPER_MODELS.standard.size})</option>
            <option value="accurate">Accurate — best for Nepali &amp; Hindi ({WHISPER_MODELS.accurate.size})</option>
          </select>
          {forced && <span className="mt-1 block text-xs text-slate-500">Accurate is required for this language.</span>}
        </label>
      </div>

      {clipLen > 15 * 60 && (
        <p className="mt-2 text-xs text-amber-600">
          Captions run on your device — for a clip this long it may take a while. Shorter clips (under 10 minutes) work best.
        </p>
      )}

      <button
        type="button"
        onClick={generate}
        disabled={disabled || clipLen < 0.5}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900"
      >
        <Captions className="size-4" /> {p.captions.length ? "Regenerate captions" : "Generate captions"}
      </button>

      {busy && (
        <div className="mt-3 text-sm">
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Loader2 className="size-4 animate-spin text-sky-600" /> {busy}
          </p>
          {progress !== null && (
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full bg-sky-600 transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {p.captions.length > 0 && (
        <>
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-800">
            {p.captions.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-2 w-24 shrink-0 font-mono text-[11px] text-slate-400">
                  {fmt(c.start)}–{fmt(c.end)}
                </span>
                <textarea
                  value={c.text}
                  rows={Math.min(3, Math.ceil(c.text.length / 40) || 1)}
                  onChange={(e) => p.onCaptions(p.captions.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                  aria-label={`Caption ${i + 1}`}
                  className="w-full resize-none rounded-md border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="block min-w-48 flex-1">
              <span className={label}>Translate captions to</span>
              <select className={cn(select, "mt-1.5")} value={target} onChange={(e) => setTarget(e.target.value)} disabled={disabled}>
                {TARGET_LANGS.filter((l) => l.code !== spokenCode).map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={translate}
              disabled={disabled}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-sky-500 px-3 text-sm font-medium text-sky-700 hover:bg-sky-50 disabled:opacity-50 dark:text-sky-300"
            >
              <Languages className="size-4" /> Translate
            </button>
            {original && (
              <button
                type="button"
                onClick={() => {
                  p.onCaptions(original);
                  setOriginal(null);
                  setNote("");
                }}
                disabled={disabled}
                className="inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm text-slate-500 hover:text-sky-600"
              >
                <Undo2 className="size-4" /> Original
              </button>
            )}
          </div>
          {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={p.burn} onChange={(e) => p.onBurn(e.target.checked)} className="size-4 accent-sky-600" />
              Burn captions into the video
            </label>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => save(toSrt(p.captions), `${p.baseName}-captions.srt`, "application/x-subrip")}
              className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:underline"
            >
              <Download className="size-4" /> SRT
            </button>
            <button
              type="button"
              onClick={() => save(toVtt(p.captions), `${p.baseName}-captions.vtt`, "text/vtt")}
              className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:underline"
            >
              <Download className="size-4" /> VTT
            </button>
          </div>
        </>
      )}
    </div>
  );
}
