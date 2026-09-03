import Link from "next/link";
import { getPlacementsForZone, type AdFormat } from "@/lib/ads";
import { AdSlot } from "@/components/ad-slot";
import { cn } from "@/lib/utils";

const RESERVED: Record<AdFormat, string> = {
  leaderboard: "min-h-[100px] md:min-h-[250px]",
  rectangle: "min-h-[250px]",
  sidebar: "min-h-[600px]",
  "mobile-banner": "min-h-[100px]",
};

/**
 * Server component. Renders admin-configured banners for a named zone inside a
 * fixed-height (zero-CLS) box. Falls back to the AdSense/placeholder AdSlot when
 * no placement is configured.
 */
export async function AdZone({
  zone,
  format = "leaderboard",
  className,
}: {
  zone: string;
  format?: AdFormat;
  className?: string;
}) {
  const placements = await getPlacementsForZone(zone);

  if (placements.length === 0) {
    return <AdSlot format={format} className={className} />;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {placements.map((p) => (
        <div
          key={p.id}
          className={cn(
            "flex w-full items-center justify-center overflow-hidden rounded-lg",
            RESERVED[p.format],
          )}
        >
          {p.imageUrl ? (
            p.targetUrl ? (
              <Link
                href={p.targetUrl}
                target="_blank"
                rel="sponsored noopener"
                className="block h-full w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-full w-full object-contain"
                />
              </Link>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.imageUrl}
                alt={p.name}
                className="h-full w-full object-contain"
              />
            )
          ) : p.htmlSnippet ? (
            <div
              className="h-full w-full"
              // Admin-authored markup — only editors/admins can set this.
              dangerouslySetInnerHTML={{ __html: p.htmlSnippet }}
            />
          ) : p.adsenseSlot ? (
            <AdSlot slot={p.adsenseSlot} format={p.format} />
          ) : (
            <AdSlot format={p.format} />
          )}
        </div>
      ))}
    </div>
  );
}
