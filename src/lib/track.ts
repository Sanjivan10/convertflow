"use client";

type EventType = "PAGEVIEW" | "CONVERSION" | "SEARCH" | "CLICK";

type TrackPayload = {
  type: EventType;
  path: string;
  toolSlug?: string;
  meta?: Record<string, unknown>;
};

/** Fire-and-forget analytics beacon. Never throws. */
export function track(payload: TrackPayload): void {
  try {
    const body = JSON.stringify({
      ...payload,
      referrer: document.referrer || undefined,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics",
        new Blob([body], { type: "application/json" }),
      );
    } else {
      void fetch("/api/analytics", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      });
    }
  } catch {
    /* analytics must never break the page */
  }
}

/** Log a site-search query (what visitors type into the tool search box). */
export function trackSearch(query: string): void {
  const q = query.trim().toLowerCase().slice(0, 120);
  if (q.length < 2) return;
  track({
    type: "SEARCH",
    path: typeof location !== "undefined" ? location.pathname : "/",
    meta: { query: q },
  });
}

/** Log a click on a tool link, CTA, or download button. */
export function trackClick(target: string, meta: Record<string, unknown> = {}): void {
  track({
    type: "CLICK",
    path: typeof location !== "undefined" ? location.pathname : "/",
    meta: { target: String(target).slice(0, 160), ...meta },
  });
}

export function logConversion(input: {
  toolSlug: string;
  fromFormat: string;
  toFormat: string;
  fileName?: string;
  fileSize?: number;
  durationMs?: number;
  success: boolean;
  error?: string;
}): void {
  try {
    void fetch("/api/convert-log", {
      method: "POST",
      body: JSON.stringify(input),
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    });
  } catch {
    /* noop */
  }
}
