/**
 * Languages offered by the footer switcher. English is the source; the rest are
 * machine-translated on the fly by the Google Translate widget.
 * Add more by appending a { code, label } — the code must be a Google Translate
 * language code.
 */
export type Language = { code: string; label: string; rtl?: boolean };

export const LANGUAGES: Language[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "nl", label: "Nederlands" },
  { code: "ru", label: "Русский" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh-CN", label: "简体中文" },
  { code: "hi", label: "हिन्दी" },
  { code: "ar", label: "العربية", rtl: true },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "tr", label: "Türkçe" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "pl", label: "Polski" },
  { code: "th", label: "ไทย" },
];

/** Comma list of every non-English code, for Google's `includedLanguages`. */
export const INCLUDED_LANGUAGES = LANGUAGES.filter((l) => l.code !== "en")
  .map((l) => l.code)
  .join(",");
