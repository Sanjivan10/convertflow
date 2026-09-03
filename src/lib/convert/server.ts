import "server-only";

/**
 * Provider-agnostic server-side document conversion.
 *
 * Configure with env vars (see .env.example):
 *   CONVERSION_PROVIDER = "convertapi" | "cloudmersive" | "gotenberg"
 *   CONVERSION_API_KEY   = secret for convertapi / cloudmersive
 *   CONVERSION_SERVICE_URL = base URL of a self-hosted Gotenberg instance
 *   CONVERSION_MAX_MB    = max upload size, default 25
 *   CONVERSION_TIMEOUT_MS = per-request timeout, default 90000
 *
 * Swapping providers is a config change only — no code edits.
 */

export type ServerConvOp =
  | "word-to-pdf"
  | "powerpoint-to-pdf"
  | "excel-to-pdf"
  | "pdf-to-powerpoint"
  | "pdf-to-pdfa"
  | "html-to-pdf"
  | "gif-compress"
  | "video-compress"
  | "audio-compress";

type OpSpec = {
  /** Accepted input file extensions (lowercase, no dot). Empty for URL-only ops. */
  fromExts: string[];
  /** Output extension. */
  outExt: string;
  outMime: string;
  /** "file" = multipart upload; "url" = a web address instead of a file. */
  kind: "file" | "url";
};

export const OP_SPEC: Record<ServerConvOp, OpSpec> = {
  "word-to-pdf": {
    fromExts: ["doc", "docx", "odt", "rtf"],
    outExt: "pdf",
    outMime: "application/pdf",
    kind: "file",
  },
  "powerpoint-to-pdf": {
    fromExts: ["ppt", "pptx", "odp"],
    outExt: "pdf",
    outMime: "application/pdf",
    kind: "file",
  },
  "excel-to-pdf": {
    fromExts: ["xls", "xlsx", "ods", "csv"],
    outExt: "pdf",
    outMime: "application/pdf",
    kind: "file",
  },
  "pdf-to-powerpoint": {
    fromExts: ["pdf"],
    outExt: "pptx",
    outMime:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    kind: "file",
  },
  "pdf-to-pdfa": {
    fromExts: ["pdf"],
    outExt: "pdf",
    outMime: "application/pdf",
    kind: "file",
  },
  "html-to-pdf": {
    fromExts: [],
    outExt: "pdf",
    outMime: "application/pdf",
    kind: "url",
  },
  "gif-compress": {
    fromExts: ["gif"],
    outExt: "gif",
    outMime: "image/gif",
    kind: "file",
  },
  "video-compress": {
    fromExts: ["mp4", "mov", "webm", "mkv", "avi", "m4v"],
    outExt: "mp4",
    outMime: "video/mp4",
    kind: "file",
  },
  "audio-compress": {
    fromExts: ["mp3", "wav", "m4a", "aac", "ogg", "flac"],
    outExt: "mp3",
    outMime: "audio/mpeg",
    kind: "file",
  },
};

const COMPRESS_OPS = new Set<ServerConvOp>([
  "gif-compress",
  "video-compress",
  "audio-compress",
]);

export function isServerConvOp(op: string): op is ServerConvOp {
  return op in OP_SPEC;
}

export class ConversionError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

type Config = {
  provider: "convertapi" | "cloudmersive" | "gotenberg";
  apiKey: string;
  serviceUrl: string;
  maxBytes: number;
  timeoutMs: number;
};

export function conversionConfig(): Config | null {
  const provider = (process.env.CONVERSION_PROVIDER || "").trim().toLowerCase();
  const apiKey = (process.env.CONVERSION_API_KEY || "").trim();
  const serviceUrl = (process.env.CONVERSION_SERVICE_URL || "").trim().replace(/\/$/, "");
  const maxMb = Number(process.env.CONVERSION_MAX_MB || 25) || 25;
  const timeoutMs = Number(process.env.CONVERSION_TIMEOUT_MS || 90_000) || 90_000;

  if (provider === "convertapi" || provider === "cloudmersive") {
    if (!apiKey) return null;
    return { provider, apiKey, serviceUrl, maxBytes: maxMb * 1024 * 1024, timeoutMs };
  }
  if (provider === "gotenberg") {
    if (!serviceUrl) return null;
    return { provider, apiKey, serviceUrl, maxBytes: maxMb * 1024 * 1024, timeoutMs };
  }
  return null;
}

export function isConversionConfigured(): boolean {
  return conversionConfig() !== null;
}

export function maxUploadBytes(): number {
  return (conversionConfig()?.maxBytes ?? 25 * 1024 * 1024);
}

/* ----------------------------- fetch helper ---------------------------- */

async function timedFetch(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ConversionError(
        "The conversion service took too long to respond. Try a smaller file.",
        504,
      );
    }
    throw new ConversionError(
      "Could not reach the conversion service. Check the network or try again.",
      502,
    );
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------ adapters ------------------------------ */

type Input = {
  op: ServerConvOp;
  fromExt: string;
  bytes?: Uint8Array;
  filename?: string;
  url?: string;
  /** 1..100 — smaller = more compression, for compress ops. */
  quality?: number;
};

async function viaConvertApi(cfg: Config, input: Input): Promise<Uint8Array> {
  const spec = OP_SPEC[input.op];
  const isCompress = COMPRESS_OPS.has(input.op);
  // ConvertAPI universal scheme: /convert/{from}/to/{to}
  const from = spec.kind === "url" ? "web" : input.fromExt;
  const to = isCompress
    ? "compress"
    : input.op === "pdf-to-pdfa"
      ? "pdfa"
      : spec.outExt;
  const endpoint = `https://v2.convertapi.com/convert/${from}/to/${to}?Secret=${encodeURIComponent(
    cfg.apiKey,
  )}`;

  const form = new FormData();
  if (spec.kind === "url") {
    form.set("Url", input.url!);
  } else {
    form.set(
      "File",
      new Blob([input.bytes as BlobPart]),
      input.filename || `input.${input.fromExt}`,
    );
  }
  if (isCompress && typeof input.quality === "number") {
    // ConvertAPI compress params vary by media type; these are all optional.
    form.set("ImageQuality", String(input.quality));
    form.set("Quality", String(input.quality));
  }

  const res = await timedFetch(endpoint, { method: "POST", body: form }, cfg.timeoutMs);
  const text = await res.text();
  if (!res.ok) {
    let msg = `Conversion service error (${res.status}).`;
    try {
      const j = JSON.parse(text);
      msg = j.Message || j.message || msg;
      if (res.status === 401 || res.status === 403)
        msg = "The conversion API key was rejected. Check CONVERSION_API_KEY.";
    } catch {
      /* keep default */
    }
    throw new ConversionError(msg, res.status === 401 ? 502 : res.status >= 500 ? 502 : 400);
  }
  const json = JSON.parse(text);
  const file = json?.Files?.[0];
  if (!file?.FileData) {
    throw new ConversionError("The conversion service returned no file.", 502);
  }
  return Uint8Array.from(Buffer.from(file.FileData, "base64"));
}

async function viaCloudmersive(cfg: Config, input: Input): Promise<Uint8Array> {
  const spec = OP_SPEC[input.op];
  if (COMPRESS_OPS.has(input.op)) {
    throw new ConversionError(
      "Media compression is only available with CONVERSION_PROVIDER=convertapi.",
      415,
    );
  }
  const base = "https://api.cloudmersive.com";
  let endpoint: string;
  let body: BodyInit;
  const headers: Record<string, string> = { Apikey: cfg.apiKey };

  if (spec.kind === "url") {
    endpoint = `${base}/convert/web/url/to/pdf`;
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({ Url: input.url });
  } else if (input.op === "pdf-to-powerpoint") {
    throw new ConversionError(
      "PDF to PowerPoint is not available on the Cloudmersive provider. Use CONVERSION_PROVIDER=convertapi.",
      415,
    );
  } else if (input.op === "pdf-to-pdfa") {
    endpoint = `${base}/convert/pdf/to/pdf-a`;
    const form = new FormData();
    form.set(
      "inputFile",
      new Blob([input.bytes as BlobPart]),
      input.filename || "input.pdf",
    );
    body = form;
  } else {
    // autodetect handles doc/docx/xls/xlsx/ppt/pptx -> pdf
    endpoint = `${base}/convert/autodetect/to/pdf`;
    const form = new FormData();
    form.set(
      "inputFile",
      new Blob([input.bytes as BlobPart]),
      input.filename || `input.${input.fromExt}`,
    );
    body = form;
  }

  const res = await timedFetch(endpoint, { method: "POST", headers, body }, cfg.timeoutMs);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403)
      throw new ConversionError(
        "The conversion API key was rejected. Check CONVERSION_API_KEY.",
        502,
      );
    throw new ConversionError(
      `Conversion service error (${res.status}). ${t.slice(0, 200)}`.trim(),
      res.status >= 500 ? 502 : 400,
    );
  }
  return new Uint8Array(await res.arrayBuffer());
}

async function viaGotenberg(cfg: Config, input: Input): Promise<Uint8Array> {
  const spec = OP_SPEC[input.op];
  if (COMPRESS_OPS.has(input.op)) {
    throw new ConversionError(
      "Media compression is only available with CONVERSION_PROVIDER=convertapi.",
      415,
    );
  }
  let endpoint: string;
  const form = new FormData();

  if (spec.kind === "url") {
    endpoint = `${cfg.serviceUrl}/forms/chromium/convert/url`;
    form.set("url", input.url!);
  } else if (input.op === "pdf-to-powerpoint") {
    throw new ConversionError(
      "PDF to PowerPoint is not available on the Gotenberg provider. Use CONVERSION_PROVIDER=convertapi.",
      415,
    );
  } else if (input.op === "pdf-to-pdfa") {
    endpoint = `${cfg.serviceUrl}/forms/pdfengines/convert`;
    form.set("pdfa", "PDF/A-2b");
    form.set(
      "files",
      new Blob([input.bytes as BlobPart]),
      input.filename || "input.pdf",
    );
  } else {
    endpoint = `${cfg.serviceUrl}/forms/libreoffice/convert`;
    form.set(
      "files",
      new Blob([input.bytes as BlobPart]),
      input.filename || `input.${input.fromExt}`,
    );
  }

  const res = await timedFetch(endpoint, { method: "POST", body: form }, cfg.timeoutMs);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new ConversionError(
      `Gotenberg error (${res.status}). ${t.slice(0, 200)}`.trim(),
      res.status >= 500 ? 502 : 400,
    );
  }
  return new Uint8Array(await res.arrayBuffer());
}

/* ------------------------------- main -------------------------------- */

export async function runServerConversion(input: {
  op: ServerConvOp;
  bytes?: Uint8Array;
  filename?: string;
  url?: string;
  quality?: number;
}): Promise<{ bytes: Uint8Array; filename: string; contentType: string }> {
  const cfg = conversionConfig();
  if (!cfg) {
    throw new ConversionError(
      "Document conversion is not configured on this deployment. Set CONVERSION_PROVIDER and CONVERSION_API_KEY (or CONVERSION_SERVICE_URL for Gotenberg).",
      503,
    );
  }

  const spec = OP_SPEC[input.op];
  let fromExt = "";

  if (spec.kind === "url") {
    if (!input.url) throw new ConversionError("A web address is required.", 400);
    assertSafeUrl(input.url);
  } else {
    if (!input.bytes || input.bytes.length === 0)
      throw new ConversionError("No file was received.", 400);
    if (input.bytes.length > cfg.maxBytes)
      throw new ConversionError(
        `File is larger than the ${Math.round(cfg.maxBytes / 1024 / 1024)} MB limit.`,
        413,
      );
    fromExt = (input.filename?.split(".").pop() || "").toLowerCase();
    if (!spec.fromExts.includes(fromExt))
      throw new ConversionError(
        `Unsupported file type ".${fromExt}". Allowed: ${spec.fromExts
          .map((e) => "." + e)
          .join(", ")}.`,
        415,
      );
  }

  const adapterInput: Input = {
    op: input.op,
    fromExt,
    bytes: input.bytes,
    filename: input.filename,
    url: input.url,
    quality:
      typeof input.quality === "number"
        ? Math.min(100, Math.max(1, Math.round(input.quality)))
        : undefined,
  };

  const out =
    cfg.provider === "convertapi"
      ? await viaConvertApi(cfg, adapterInput)
      : cfg.provider === "cloudmersive"
        ? await viaCloudmersive(cfg, adapterInput)
        : await viaGotenberg(cfg, adapterInput);

  if (!out || out.length === 0) {
    throw new ConversionError("The conversion produced an empty file.", 502);
  }

  const stem =
    spec.kind === "url"
      ? "webpage"
      : (input.filename || "document").replace(/\.[^.]+$/, "");
  const suffix = COMPRESS_OPS.has(input.op) ? "-compressed" : "";

  return {
    bytes: out,
    filename: `${stem}${suffix}.${spec.outExt}`,
    contentType: spec.outMime,
  };
}

/* --------------------------- SSRF guard ------------------------------ */

function assertSafeUrl(raw: string) {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new ConversionError("That doesn't look like a valid URL.", 400);
  }
  if (u.protocol !== "http:" && u.protocol !== "https:")
    throw new ConversionError("Only http(s) URLs are allowed.", 400);
  const host = u.hostname.toLowerCase();
  const blocked =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (blocked)
    throw new ConversionError("That URL points to a private address.", 400);
}
