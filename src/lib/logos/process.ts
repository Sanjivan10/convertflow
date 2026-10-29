/**
 * Browser-side image processing for the Motion Logo PNG Maker.
 * Pure functions over ImageData / canvas — no network, nothing uploaded.
 */

export type BgMode = "auto" | "color" | "none";
export type Recolor = "original" | "white" | "black" | "custom";
export type Shape = "none" | "circle" | "rounded";

export type RGB = [number, number, number];

/** Longest side used while processing — keeps big uploads fast. */
export const WORK_MAX = 3000;

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

const dist = (d: Uint8ClampedArray, i: number, c: RGB) => {
  const r = d[i] - c[0];
  const g = d[i + 1] - c[1];
  const b = d[i + 2] - c[2];
  return Math.sqrt(r * r + g * g + b * b);
};

/** True when the image already has a transparent background (corners clear). */
export function hasTransparentEdges(img: ImageData): boolean {
  const { data, width: w, height: h } = img;
  let clear = 0;
  let total = 0;
  const check = (x: number, y: number) => {
    total++;
    if (data[(y * w + x) * 4 + 3] < 16) clear++;
  };
  for (let x = 0; x < w; x += Math.max(1, Math.floor(w / 50))) {
    check(x, 0);
    check(x, h - 1);
  }
  for (let y = 0; y < h; y += Math.max(1, Math.floor(h / 50))) {
    check(0, y);
    check(w - 1, y);
  }
  return clear / total > 0.6;
}

/** Most common opaque color along the image border — the likely background. */
export function detectBackground(img: ImageData): RGB {
  const { data, width: w, height: h } = img;
  const counts = new Map<number, { n: number; sum: [number, number, number] }>();
  const add = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    if (data[i + 3] < 128) return;
    // Bucket colors (32 levels) so tiny noise doesn't split the vote.
    const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
    const e = counts.get(key) ?? { n: 0, sum: [0, 0, 0] };
    e.n++;
    e.sum[0] += data[i];
    e.sum[1] += data[i + 1];
    e.sum[2] += data[i + 2];
    counts.set(key, e);
  };
  for (let x = 0; x < w; x++) {
    add(x, 0);
    add(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    add(0, y);
    add(w - 1, y);
  }
  let best: { n: number; sum: [number, number, number] } | undefined;
  for (const e of counts.values()) if (!best || e.n > best.n) best = e;
  if (!best) return [255, 255, 255];
  return [
    Math.round(best.sum[0] / best.n),
    Math.round(best.sum[1] / best.n),
    Math.round(best.sum[2] / best.n),
  ];
}

/**
 * Removes the background in place.
 * - "auto": flood-fills from the image edges, so white parts *inside* the
 *   logo (letters, highlights) are kept.
 * - "color": removes that color everywhere in the image.
 * Pixels just above the tolerance get partial transparency, and the
 * background color is un-mixed from them so there is no white/colored halo.
 */
export function removeBackground(
  img: ImageData,
  mode: Exclude<BgMode, "none">,
  bg: RGB,
  tolerance: number,
) {
  const { data, width: w, height: h } = img;
  const n = w * h;
  // tolerance 0–100 → RGB distance 0–220; soft band above it for smooth edges.
  const hard = (tolerance / 100) * 220;
  const soft = hard + Math.max(18, hard * 0.6);
  const removed = new Uint8Array(n);

  if (mode === "color") {
    for (let p = 0; p < n; p++) {
      if (dist(data, p * 4, bg) <= hard) removed[p] = 1;
    }
  } else {
    const stack = new Int32Array(n);
    let top = 0;
    const seed = (p: number) => {
      if (!removed[p] && (data[p * 4 + 3] < 16 || dist(data, p * 4, bg) <= hard)) {
        removed[p] = 1;
        stack[top++] = p;
      }
    };
    for (let x = 0; x < w; x++) {
      seed(x);
      seed((h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      seed(y * w);
      seed(y * w + w - 1);
    }
    while (top > 0) {
      const p = stack[--top];
      const x = p % w;
      if (x > 0) seed(p - 1);
      if (x < w - 1) seed(p + 1);
      if (p >= w) seed(p - w);
      if (p < n - w) seed(p + w);
    }
  }

  for (let p = 0; p < n; p++) {
    const i = p * 4;
    if (removed[p]) {
      data[i + 3] = 0;
      continue;
    }
    // Soft edge only next to removed pixels (auto) or anywhere (color mode).
    if (mode === "auto") {
      const x = p % w;
      const edge =
        (x > 0 && removed[p - 1]) ||
        (x < w - 1 && removed[p + 1]) ||
        (p >= w && removed[p - w]) ||
        (p < n - w && removed[p + w]);
      if (!edge) continue;
    }
    const d = dist(data, i, bg);
    if (d >= soft) continue;
    const a = Math.max(0, Math.min(1, (d - hard) / (soft - hard)));
    if (a <= 0.02) {
      data[i + 3] = 0;
      continue;
    }
    // Un-mix the background: observed = fg*a + bg*(1-a).
    for (let k = 0; k < 3; k++) {
      data[i + k] = Math.max(0, Math.min(255, (data[i + k] - bg[k] * (1 - a)) / a));
    }
    data[i + 3] = Math.round(data[i + 3] * a);
  }
}

/** Paints every visible pixel one color, keeping its transparency. */
export function recolor(img: ImageData, color: RGB) {
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    d[i] = color[0];
    d[i + 1] = color[1];
    d[i + 2] = color[2];
  }
}

/** Bounding box of visible pixels (alpha > 8), or null if the image is empty. */
export function contentBox(img: ImageData) {
  const { data, width: w, height: h } = img;
  let x1 = w;
  let y1 = h;
  let x2 = -1;
  let y2 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < x1) x1 = x;
        if (x > x2) x2 = x;
        if (y < y1) y1 = y;
        if (y > y2) y2 = y;
      }
    }
  }
  if (x2 < 0) return null;
  return { x: x1, y: y1, w: x2 - x1 + 1, h: y2 - y1 + 1 };
}

export type ComposeOptions = {
  width: number;
  paddingPct: number;
  shape: Shape;
  shapeColor: string;
  /** Solid background behind everything (JPG, or a chosen color). */
  background: string | null;
};

/** Draws the processed logo onto a final canvas of the requested size. */
export function compose(logo: HTMLCanvasElement, o: ComposeOptions): HTMLCanvasElement {
  const out = document.createElement("canvas");
  const W = Math.max(16, Math.round(o.width));
  const lw = logo.width;
  const lh = logo.height;

  if (o.shape === "none") {
    const pad = Math.round((W * o.paddingPct) / 100);
    const innerW = Math.max(1, W - pad * 2);
    const innerH = Math.max(1, Math.round((innerW * lh) / lw));
    out.width = W;
    out.height = innerH + pad * 2;
    const ctx = out.getContext("2d")!;
    if (o.background) {
      ctx.fillStyle = o.background;
      ctx.fillRect(0, 0, out.width, out.height);
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(logo, pad, pad, innerW, innerH);
    return out;
  }

  // Badge shapes are square; the logo fits inside the shape's safe area.
  out.width = W;
  out.height = W;
  const ctx = out.getContext("2d")!;
  if (o.background) {
    ctx.fillStyle = o.background;
    ctx.fillRect(0, 0, W, W);
  }
  ctx.fillStyle = o.shapeColor;
  ctx.beginPath();
  if (o.shape === "circle") {
    ctx.arc(W / 2, W / 2, W / 2, 0, Math.PI * 2);
  } else {
    const r = W * 0.22;
    ctx.roundRect(0, 0, W, W, r);
  }
  ctx.fill();
  const safe = W * (o.shape === "circle" ? 0.68 : 0.76) * (1 - o.paddingPct / 50);
  const scale = Math.min(safe / lw, safe / lh);
  const dw = lw * scale;
  const dh = lh * scale;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(logo, (W - dw) / 2, (W - dh) / 2, dw, dh);
  return out;
}
