"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";

export function PageviewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    // utm_source shows which AI assistant sent the visit (ChatGPT adds
    // ?utm_source=chatgpt.com to the links it cites).
    let utm: string | undefined;
    try {
      utm = new URLSearchParams(window.location.search).get("utm_source") ?? undefined;
    } catch {
      /* ignore */
    }
    track({ type: "PAGEVIEW", path: pathname, meta: utm ? { utm } : undefined });
  }, [pathname]);
  return null;
}
