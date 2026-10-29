/**
 * AI assistants & answer engines: how to recognise their visitors and their
 * crawlers. Used by the proxy (logs AI fetches), the pageview tracker and the
 * admin dashboard's "AI search & citations" section.
 *
 * Important limit: no AI platform passes the user's prompt to the sites it
 * cites. We can see THAT a visit came from ChatGPT (referrer / utm_source) and
 * WHICH page an assistant read while answering, never the prompt text itself.
 */

export type AiPlatformId =
  | "chatgpt"
  | "gemini"
  | "claude"
  | "perplexity"
  | "grok"
  | "copilot"
  | "deepseek"
  | "meta";

export type AiPlatform = {
  id: AiPlatformId;
  name: string;
  /** Referrer hostnames (exact or subdomain). */
  hosts: string[];
  /** utm_source values some assistants append to links (e.g. ChatGPT). */
  utm: string[];
};

export const AI_PLATFORMS: AiPlatform[] = [
  { id: "chatgpt", name: "ChatGPT", hosts: ["chatgpt.com", "chat.openai.com"], utm: ["chatgpt.com", "chatgpt", "openai"] },
  { id: "gemini", name: "Gemini", hosts: ["gemini.google.com", "bard.google.com"], utm: ["gemini", "gemini.google.com"] },
  { id: "claude", name: "Claude", hosts: ["claude.ai"], utm: ["claude.ai", "claude"] },
  { id: "perplexity", name: "Perplexity", hosts: ["perplexity.ai"], utm: ["perplexity", "perplexity.ai"] },
  { id: "grok", name: "Grok", hosts: ["grok.com"], utm: ["grok", "grok.com"] },
  { id: "copilot", name: "Copilot", hosts: ["copilot.microsoft.com", "copilot.cloud.microsoft"], utm: ["copilot", "copilot.com"] },
  { id: "deepseek", name: "DeepSeek", hosts: ["chat.deepseek.com"], utm: ["deepseek"] },
  { id: "meta", name: "Meta AI", hosts: ["meta.ai"], utm: ["meta.ai"] },
];

/** Which AI platform sent this visit, from the referrer and/or utm_source. */
export function aiPlatformForVisit(
  referrer: string | null | undefined,
  utm: string | null | undefined,
): AiPlatform | null {
  const u = (utm || "").toLowerCase();
  if (u) {
    const byUtm = AI_PLATFORMS.find((p) => p.utm.includes(u));
    if (byUtm) return byUtm;
  }
  if (!referrer) return null;
  let host = "";
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
  return (
    AI_PLATFORMS.find((p) => p.hosts.some((h) => host === h || host.endsWith(`.${h}`))) ?? null
  );
}

/**
 * kind:
 *  - "live": fetched because a person asked the assistant something right now
 *    (the strongest "your page was cited" signal).
 *  - "index": building the assistant's search index.
 *  - "training": collecting data to train models.
 */
export type AiBotKind = "live" | "index" | "training";
export type AiBot = { token: string; platform: AiPlatformId | "other"; label: string; kind: AiBotKind };

export const AI_BOTS: AiBot[] = [
  { token: "ChatGPT-User", platform: "chatgpt", label: "ChatGPT-User", kind: "live" },
  { token: "OAI-SearchBot", platform: "chatgpt", label: "OAI-SearchBot", kind: "index" },
  { token: "GPTBot", platform: "chatgpt", label: "GPTBot", kind: "training" },
  { token: "Perplexity-User", platform: "perplexity", label: "Perplexity-User", kind: "live" },
  { token: "PerplexityBot", platform: "perplexity", label: "PerplexityBot", kind: "index" },
  { token: "Claude-User", platform: "claude", label: "Claude-User", kind: "live" },
  { token: "Claude-SearchBot", platform: "claude", label: "Claude-SearchBot", kind: "index" },
  { token: "ClaudeBot", platform: "claude", label: "ClaudeBot", kind: "training" },
  { token: "meta-externalfetcher", platform: "meta", label: "Meta AI fetcher", kind: "live" },
  { token: "meta-externalagent", platform: "meta", label: "Meta AI crawler", kind: "training" },
  { token: "DuckAssistBot", platform: "other", label: "DuckAssist", kind: "live" },
  { token: "MistralAI-User", platform: "other", label: "Mistral Le Chat", kind: "live" },
  { token: "Amazonbot", platform: "other", label: "Amazonbot", kind: "index" },
  { token: "Bytespider", platform: "other", label: "Bytespider", kind: "training" },
  { token: "cohere-ai", platform: "other", label: "Cohere", kind: "training" },
];

export function aiBotForUserAgent(ua: string | null | undefined): AiBot | null {
  if (!ua) return null;
  return AI_BOTS.find((b) => ua.includes(b.token)) ?? null;
}

export function aiPlatformName(id: string): string {
  return AI_PLATFORMS.find((p) => p.id === id)?.name ?? (id === "other" ? "Other AI" : id);
}

const cap = (s: string) => s.toUpperCase();

/**
 * Likely prompts for a landing page. These are ESTIMATES — the typical way
 * people phrase a request that leads an assistant to this page — because the
 * real prompt text is never shared with websites.
 */
export function likelyPrompts(path: string): string[] {
  const clean = path.split(/[?#]/)[0];
  const [section, slug = ""] = clean.split("/").filter(Boolean);
  const words = slug.replace(/-/g, " ").trim();
  const toPair = slug.match(/^(.+?)-to-(.+)$/);

  if (!section) {
    return ["free online file converter with no sign up", "convert files online without uploading them"];
  }
  if (section === "tools" && !slug) return ["free online pdf and image tools", "best free file converter website"];
  if (section === "blog" && !slug) return ["guides for converting and editing pdf files"];
  if (toPair && (section === "convert" || section === "tools")) {
    const [, a, b] = toPair;
    const A = cap(a.replace(/-/g, " "));
    const B = cap(b.replace(/-/g, " "));
    return [`convert ${A} to ${B} free online`, `how do I convert ${A} to ${B} without uploading the file`];
  }
  if (section === "compress") {
    const what = words.replace(/\s*compressor$/, "") || "file";
    return [`how to compress ${what} without losing quality`, `best free ${words} online`];
  }
  if (section === "tools") {
    return [`how to ${words} for free`, `best free online tool to ${words}`];
  }
  if (section === "logo") {
    if (slug.includes("motion-logo")) {
      return ["how to make my logo a transparent png for alight motion", "alight motion logo png"];
    }
    return [`${words}`, `${words} transparent download`];
  }
  if (section === "blog") return [words];
  return [words || section];
}
