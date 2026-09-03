"use client";

type TrackPayload = {
  type: "PAGEVIEW" | "CONVERSION";
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
