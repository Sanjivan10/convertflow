import "server-only";
import { siteConfig, absoluteUrl } from "@/lib/site";

/**
 * IndexNow key: not a secret — it's served publicly at /indexnow-key.txt so
 * search engines can verify we own this host. Bing and Yandex consume this
 * protocol directly and (re)crawl a submitted URL within minutes. Google does
 * not participate in IndexNow — this has no effect on Google indexing speed.
 */
export const INDEXNOW_KEY = "ffe8ad3f3602cb2dc2586a8e93835f79";

/**
 * Notifies IndexNow-participating search engines (Bing, Yandex) that a URL
 * was just published or updated, so they can (re)crawl it within minutes
 * instead of waiting for their next scheduled pass. Fire-and-forget: this
 * never throws, so a slow or unreachable endpoint can't block a publish.
 */
export async function pingIndexNow(paths: string[]) {
  if (paths.length === 0) return;
  const host = new URL(siteConfig.url).host;

  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: absoluteUrl("/indexnow-key.txt"),
        urlList: paths.map((p) => absoluteUrl(p)),
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // best-effort only — publishing must never fail because of this
  }
}
