"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { INCLUDED_LANGUAGES, LANGUAGES } from "@/lib/languages";

/**
 * Footer language picker. Uses the Google Translate widget to machine-translate
 * every visible string on the page (headings, descriptions, FAQs, keywords in
 * the copy) from English into the chosen language — no page rebuild needed.
 *
 * The choice is stored in the `googtrans` cookie so it persists across pages
 * and reloads, exactly like translate.google.com.
 */
function readCurrent(): string {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "en";
}

function setLanguage(code: string) {
  const host = window.location.hostname;
  const scopes = ["", `;domain=${host}`, `;domain=.${host}`];
  // clear any previous value on every scope
  for (const s of scopes) {
    document.cookie = `googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/${s}`;
  }
  if (code !== "en") {
    for (const s of scopes) {
      document.cookie = `googtrans=/en/${code};path=/${s}`;
    }
  }
  window.location.reload();
}

export function LanguageSwitcher({
  className,
  labelColor,
}: {
  className?: string;
  labelColor?: string;
}) {
  const [current, setCurrent] = useState("en");

  useEffect(() => {
    // The active language lives in a cookie that is only readable in the
    // browser, so it is synced here after mount (avoids an SSR/hydration
    // mismatch on the <select value>).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(readCurrent());

    if (document.getElementById("google-translate-script")) return;
    window.googleTranslateElementInit = () => {
      try {
        new window.google!.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: INCLUDED_LANGUAGES,
            autoDisplay: false,
          },
          "google_translate_element",
        );
      } catch {
        /* widget unavailable — the select still no-ops gracefully */
      }
    };
    const s = document.createElement("script");
    s.id = "google-translate-script";
    s.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return (
    <div className={className}>
      {/* Google mounts its (hidden) widget here. */}
      <div id="google_translate_element" aria-hidden className="hidden" />

      <label
        className="inline-flex items-center gap-2 text-sm"
        style={{ color: labelColor }}
      >
        <Globe className="size-4 opacity-70" />
        <span className="sr-only">Choose language</span>
        <select
          value={current}
          onChange={(e) => setLanguage(e.target.value)}
          className="cursor-pointer rounded-md border border-current/20 bg-transparent px-2 py-1 text-sm outline-none"
          style={{ color: "inherit" }}
          translate="no"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="text-slate-900">
              {l.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
