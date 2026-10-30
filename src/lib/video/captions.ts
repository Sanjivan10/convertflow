/**
 * Browser-only caption engine for the Video Cutter.
 * - Speech → text: Whisper (MIT) via Transformers.js, CPU/WebAssembly in a
 *   background worker (proxy), so the page stays responsive.
 * - Translation: Chrome's on-device Translator API when available, otherwise
 *   M2M100 (MIT) in the browser.
 * Nothing is uploaded; models download once and are cached by the browser.
 */

export type Caption = { start: number; end: number; text: string };

/** Transformers.js is loaded from the CDN at a pinned version, only when needed. */
const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1";

export type Lang = { code: string; name: string; whisper?: string };

/** Spoken languages Whisper can transcribe (popular first). */
export const SPOKEN_LANGS: Lang[] = [
  { code: "en", name: "English", whisper: "english" },
  { code: "ne", name: "Nepali (नेपाली)", whisper: "nepali" },
  { code: "hi", name: "Hindi (हिन्दी)", whisper: "hindi" },
  { code: "bn", name: "Bengali", whisper: "bengali" },
  { code: "ur", name: "Urdu", whisper: "urdu" },
  { code: "mr", name: "Marathi", whisper: "marathi" },
  { code: "ta", name: "Tamil", whisper: "tamil" },
  { code: "te", name: "Telugu", whisper: "telugu" },
  { code: "gu", name: "Gujarati", whisper: "gujarati" },
  { code: "pa", name: "Punjabi", whisper: "punjabi" },
  { code: "ml", name: "Malayalam", whisper: "malayalam" },
  { code: "kn", name: "Kannada", whisper: "kannada" },
  { code: "si", name: "Sinhala", whisper: "sinhala" },
  { code: "es", name: "Spanish", whisper: "spanish" },
  { code: "pt", name: "Portuguese", whisper: "portuguese" },
  { code: "fr", name: "French", whisper: "french" },
  { code: "de", name: "German", whisper: "german" },
  { code: "it", name: "Italian", whisper: "italian" },
  { code: "ru", name: "Russian", whisper: "russian" },
  { code: "ar", name: "Arabic", whisper: "arabic" },
  { code: "tr", name: "Turkish", whisper: "turkish" },
  { code: "id", name: "Indonesian", whisper: "indonesian" },
  { code: "ms", name: "Malay", whisper: "malay" },
  { code: "vi", name: "Vietnamese", whisper: "vietnamese" },
  { code: "th", name: "Thai", whisper: "thai" },
  { code: "tl", name: "Filipino", whisper: "tagalog" },
  { code: "zh", name: "Chinese", whisper: "chinese" },
  { code: "ja", name: "Japanese", whisper: "japanese" },
  { code: "ko", name: "Korean", whisper: "korean" },
  { code: "fa", name: "Persian", whisper: "persian" },
  { code: "sw", name: "Swahili", whisper: "swahili" },
  { code: "nl", name: "Dutch", whisper: "dutch" },
  { code: "pl", name: "Polish", whisper: "polish" },
  { code: "uk", name: "Ukrainian", whisper: "ukrainian" },
];

/** Translation targets (M2M100 covers all of these except Telugu). */
export const TARGET_LANGS: Lang[] = SPOKEN_LANGS.filter((l) => l.code !== "te");

export type Accuracy = "standard" | "accurate";
export const WHISPER_MODELS: Record<Accuracy, { id: string; size: string; factor: number }> = {
  // factor ≈ seconds of processing per second of audio on a typical laptop CPU.
  standard: { id: "onnx-community/whisper-base", size: "73 MB", factor: 0.5 },
  accurate: { id: "onnx-community/whisper-small", size: "237 MB", factor: 2.2 },
};
/** Whisper Base writes Hindi/Nepali in the wrong script, so these need Small. */
export const NEEDS_ACCURATE = new Set(["ne", "hi", "mr", "ur", "pa", "gu", "bn", "ta", "te", "ml", "kn", "si"]);

/* eslint-disable @typescript-eslint/no-explicit-any */
let tfPromise: Promise<any> | null = null;
function loadTransformers(): Promise<any> {
  tfPromise ??= (async () => {
    // new Function keeps the bundler from trying to resolve the CDN URL.
    const tf = await (new Function("u", "return import(u)") as (u: string) => Promise<any>)(TRANSFORMERS_URL);
    tf.env.backends.onnx.wasm.proxy = true; // run inference in a worker
    return tf;
  })();
  tfPromise.catch(() => (tfPromise = null));
  return tfPromise;
}
const pipelines = new Map<string, Promise<any>>();
function getPipeline(task: string, model: string, options: Record<string, unknown>, onProgress?: (p: number) => void) {
  const key = `${task}:${model}`;
  let p = pipelines.get(key);
  if (!p) {
    p = (async () => {
      const tf = await loadTransformers();
      const files = new Map<string, [number, number]>();
      return tf.pipeline(task, model, {
        ...options,
        progress_callback: (e: any) => {
          if (e.status === "progress" && e.file && e.total) {
            files.set(e.file, [e.loaded ?? 0, e.total]);
            let l = 0;
            let t = 0;
            files.forEach(([a, b]) => {
              l += a;
              t += b;
            });
            onProgress?.(t ? l / t : 0);
          }
        },
      });
    })();
    pipelines.set(key, p);
    p.catch(() => pipelines.delete(key));
  }
  return p;
}
export const isModelLoaded = (task: string, model: string) => pipelines.has(`${task}:${model}`);

/** 16 kHz mono PCM (Float32) of [start, end] from a mediabunny Input. */
export async function extractAudio16k(mb: any, input: any, start: number, end: number): Promise<Float32Array> {
  const target = new mb.BufferTarget();
  const output = new mb.Output({ format: new mb.WavOutputFormat(), target });
  const conv = await mb.Conversion.init({
    input,
    output,
    trim: { start, end },
    video: { discard: true },
    audio: { numberOfChannels: 1, sampleRate: 16000 },
    showWarnings: false,
  });
  if (!conv.isValid) throw new Error("This video has no audio track to caption.");
  await conv.execute();
  return parseWav(target.buffer as ArrayBuffer);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function parseWav(buf: ArrayBuffer): Float32Array {
  const d = new DataView(buf);
  let o = 12;
  let fmt = 1;
  let bits = 16;
  while (o + 8 <= buf.byteLength) {
    const id = String.fromCharCode(d.getUint8(o), d.getUint8(o + 1), d.getUint8(o + 2), d.getUint8(o + 3));
    const size = d.getUint32(o + 4, true);
    if (id === "fmt ") {
      fmt = d.getUint16(o + 8, true);
      bits = d.getUint16(o + 22, true);
    } else if (id === "data") {
      const start = o + 8;
      const len = Math.min(size, buf.byteLength - start);
      if (fmt === 3 && bits === 32) return new Float32Array(buf.slice(start, start + len));
      if (bits === 16) {
        const n = len >> 1;
        const out = new Float32Array(n);
        for (let i = 0; i < n; i++) out[i] = d.getInt16(start + i * 2, true) / 32768;
        return out;
      }
      if (bits === 24) {
        const n = Math.floor(len / 3);
        const out = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const p = start + i * 3;
          let v = d.getUint8(p) | (d.getUint8(p + 1) << 8) | (d.getUint8(p + 2) << 16);
          if (v & 0x800000) v |= ~0xffffff;
          out[i] = v / 8388608;
        }
        return out;
      }
      if (bits === 32) {
        const n = len >> 2;
        const out = new Float32Array(n);
        for (let i = 0; i < n; i++) out[i] = d.getInt32(start + i * 4, true) / 2147483648;
        return out;
      }
      throw new Error("Unsupported audio format.");
    }
    o += 8 + size + (size & 1);
  }
  throw new Error("No audio found in this part of the video.");
}

/** Splits long Whisper segments into readable caption lines (~84 chars). */
function splitLong(c: Caption, max = 84): Caption[] {
  const text = c.text.trim();
  if (text.length <= max) return [{ ...c, text }];
  const words = text.split(/\s+/);
  const parts: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > max) {
      parts.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) parts.push(cur);
  const total = parts.reduce((a, p) => a + p.length, 0);
  let t = c.start;
  return parts.map((p) => {
    const dur = ((c.end - c.start) * p.length) / total;
    const piece = { start: t, end: t + dur, text: p };
    t += dur;
    return piece;
  });
}

export async function transcribe(
  audio: Float32Array,
  opts: { language: string | null; accuracy: Accuracy },
  onDownload: (p: number) => void,
): Promise<Caption[]> {
  const model = WHISPER_MODELS[opts.accuracy].id;
  const asr = await getPipeline(
    "automatic-speech-recognition",
    model,
    { device: "wasm", dtype: { encoder_model: "q8", decoder_model_merged: "q8" } },
    onDownload,
  );
  const out = await asr(audio, {
    ...(opts.language ? { language: opts.language } : {}),
    task: "transcribe",
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
  });
  const dur = audio.length / 16000;
  const chunks: { timestamp: [number, number | null]; text: string }[] = out.chunks ?? [
    { timestamp: [0, dur], text: out.text ?? "" },
  ];
  return chunks
    .map((ch) => ({
      start: Math.max(0, ch.timestamp[0] ?? 0),
      end: Math.min(dur, ch.timestamp[1] ?? dur),
      text: (ch.text ?? "").trim(),
    }))
    .filter((c) => c.text && c.end > c.start)
    .flatMap((c) => splitLong(c));
}

/** Translates caption texts. Chrome's on-device translator first, then M2M100. */
export async function translateCaptions(
  caps: Caption[],
  from: string,
  to: string,
  onStatus: (s: string, p?: number) => void,
): Promise<{ captions: Caption[]; engine: "chrome" | "m2m100" }> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const T = (globalThis as any).Translator;
  if (T?.create) {
    try {
      const avail = await T.availability({ sourceLanguage: from, targetLanguage: to });
      if (avail && avail !== "unavailable") {
        onStatus("Preparing your browser’s translator…");
        const tr = await T.create({
          sourceLanguage: from,
          targetLanguage: to,
          monitor(m: any) {
            m.addEventListener("downloadprogress", (e: any) => onStatus("Downloading language pack…", e.loaded));
          },
        });
        const out: Caption[] = [];
        for (let i = 0; i < caps.length; i++) {
          onStatus("Translating…", i / caps.length);
          out.push({ ...caps[i], text: await tr.translate(caps[i].text) });
        }
        return { captions: out, engine: "chrome" };
      }
    } catch {
      /* fall back to M2M100 */
    }
  }
  const mt = await getPipeline("translation", "Xenova/m2m100_418M", { device: "wasm", dtype: "q8" }, (p) =>
    onStatus("Downloading translation model (~600 MB, one time)…", p),
  );
  const out: Caption[] = [];
  for (let i = 0; i < caps.length; i++) {
    onStatus("Translating…", i / caps.length);
    const r = await mt(caps[i].text, { src_lang: from, tgt_lang: to });
    out.push({ ...caps[i], text: (r?.[0]?.translation_text ?? caps[i].text).trim() });
  }
  return { captions: out, engine: "m2m100" };
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, "0");
function stamp(t: number, sep: "," | ".") {
  const ms = Math.round(t * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}${sep}${pad(ms % 1000, 3)}`;
}

export function toSrt(caps: Caption[]): string {
  return caps.map((c, i) => `${i + 1}\n${stamp(c.start, ",")} --> ${stamp(c.end, ",")}\n${c.text}\n`).join("\n");
}

export function toVtt(caps: Caption[], offset = 0): string {
  return (
    "WEBVTT\n\n" +
    caps.map((c) => `${stamp(c.start + offset, ".")} --> ${stamp(c.end + offset, ".")}\n${c.text}\n`).join("\n")
  );
}

/** Draws a caption (wrapped, outlined) near the bottom of a frame. */
export function drawCaption(ctx: CanvasRenderingContext2D, text: string, W: number, H: number, scale = 1) {
  if (!text) return;
  const size = Math.max(16, Math.round(Math.min(W, H) * 0.055 * scale));
  ctx.font = `700 ${size}px system-ui, "Noto Sans Devanagari", "Nirmala UI", "Kohinoor Devanagari", "Noto Sans", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const maxW = W * 0.9;
  const lines: string[] = [];
  let cur = "";
  for (const w of text.split(/\s+/)) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && ctx.measureText(next).width > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  const lh = size * 1.25;
  let y = H - H * 0.07 - (lines.length - 1) * lh;
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(3, size * 0.18);
  ctx.strokeStyle = "rgba(0,0,0,0.9)";
  ctx.fillStyle = "#ffffff";
  for (const l of lines) {
    ctx.strokeText(l, W / 2, y);
    ctx.fillText(l, W / 2, y);
    y += lh;
  }
}

export function captionAt(caps: Caption[], t: number): string {
  for (const c of caps) if (t >= c.start && t < c.end) return c.text;
  return "";
}
