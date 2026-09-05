import { INDEXNOW_KEY } from "@/lib/indexnow";

/** Ownership-verification file required by the IndexNow protocol. */
export async function GET() {
  return new Response(INDEXNOW_KEY, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
