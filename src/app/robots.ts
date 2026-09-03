import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Everything public is open to every crawler — search engines *and* AI/LLM
// crawlers (they drive AEO / GEO visibility). Only the admin area and internal
// API endpoints are off-limits.
const BLOCKED = ["/admin", "/admin/", "/api/"];

// AI / answer-engine crawlers we explicitly welcome.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "meta-externalagent",
  "meta-externalfetcher",
  "CCBot",
  "Bytespider",
  "cohere-ai",
  "Diffbot",
  "Timpibot",
  "YouBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: BLOCKED },
      { userAgent: AI_BOTS, allow: "/", disallow: BLOCKED },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl(),
  };
}
