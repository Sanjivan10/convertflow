"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

type AdSlotProps = {
  /** Ad unit slot id from AdSense. Optional — a placeholder renders without it. */
  slot?: string;
  /** Reserved shape. Each maps to a fixed min-height so there is zero CLS. */
  format?: "leaderboard" | "rectangle" | "sidebar" | "mobile-banner";
  className?: string;
  label?: string;
};

const RESERVED: Record<NonNullable<AdSlotProps["format"]>, string> = {
  // min-h chosen to match the tallest ad that unit can serve.
  leaderboard: "min-h-[100px] md:min-h-[250px]",
  rectangle: "min-h-[250px]",
  sidebar: "min-h-[600px]",
  "mobile-banner": "min-h-[100px]",
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({
  slot,
  format = "leaderboard",
  className,
  label = "Advertisement",
}: AdSlotProps) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const client = siteConfig.adsenseClient;
  const live = Boolean(client && slot);

  useEffect(() => {
    if (!live || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* AdSense not ready yet — it will retry on next navigation */
    }
  }, [live]);

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40",
        RESERVED[format],
        className,
      )}
      aria-hidden={!live}
    >
      <span className="mb-1 text-[10px] font-medium uppercase tracking-widest text-slate-400">
        {label}
      </span>
      {live ? (
        <ins
          ref={ref}
          className="adsbygoogle block w-full"
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <span className="text-xs text-slate-400">Ad space ({format})</span>
      )}
    </div>
  );
}
