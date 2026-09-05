import { siteConfig } from "@/lib/site";

/**
 * Google requires an ads.txt file at the site root once AdSense is approved,
 * declaring the publisher ID as an authorized seller. This derives it from
 * the same NEXT_PUBLIC_ADSENSE_CLIENT env var the AdSense script already
 * uses, so there's nothing extra to configure — set the one env var and
 * both the script tag and this file activate together.
 */
export async function GET() {
  const client = siteConfig.adsenseClient; // e.g. "ca-pub-1234567890123456"
  const pubId = client.replace(/^ca-/, "");
  const body = pubId ? `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n` : "";

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
