"use client";

import { useEffect } from "react";

const EVENTS = ["scroll", "pointerdown", "touchstart", "keydown", "mousemove"] as const;

/**
 * Loads the AdSense script only after the visitor first interacts with the
 * page (scroll, tap, key, mouse move). AdSense plus its consent popup is
 * ~290 KB of script; loading it up front was the biggest drag on the mobile
 * PageSpeed score. Ad slots queue into `window.adsbygoogle` before this runs,
 * so they fill as soon as the script arrives.
 */
export function AdsenseLoader({ client }: { client: string }) {
  useEffect(() => {
    if (document.getElementById("adsbygoogle-init")) return;

    const load = () => {
      EVENTS.forEach((e) => window.removeEventListener(e, load));
      if (document.getElementById("adsbygoogle-init")) return;
      const s = document.createElement("script");
      s.id = "adsbygoogle-init";
      s.async = true;
      s.crossOrigin = "anonymous";
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      document.head.appendChild(s);
    };

    EVENTS.forEach((e) => window.addEventListener(e, load, { once: true, passive: true }));
    return () => EVENTS.forEach((e) => window.removeEventListener(e, load));
  }, [client]);

  return null;
}
