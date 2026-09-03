import "server-only";
import { prisma } from "@/lib/prisma";

export type AdFormat = "leaderboard" | "rectangle" | "sidebar" | "mobile-banner";

export type AdPlacementView = {
  id: string;
  name: string;
  zone: string;
  format: AdFormat;
  enabled: boolean;
  imageUrl: string | null;
  targetUrl: string | null;
  htmlSnippet: string | null;
  adsenseSlot: string | null;
  position: number;
};

export const AD_ZONES: { id: string; label: string; suggested: AdFormat }[] = [
  { id: "home-top", label: "Homepage — below hero", suggested: "leaderboard" },
  { id: "home-mid", label: "Homepage — between sections", suggested: "leaderboard" },
  { id: "tools-top", label: "Tools index — top", suggested: "leaderboard" },
  { id: "tool-top", label: "Tool page — above workspace", suggested: "leaderboard" },
  { id: "tool-bottom", label: "Tool page — below workspace", suggested: "leaderboard" },
  { id: "tool-sidebar", label: "Tool page — desktop sidebar", suggested: "sidebar" },
  { id: "tool-footer", label: "Tool page — near footer", suggested: "rectangle" },
  { id: "blog-top", label: "Blog — top", suggested: "leaderboard" },
  { id: "blog-bottom", label: "Blog post — bottom", suggested: "rectangle" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(row: any): AdPlacementView {
  return {
    id: row.id,
    name: row.name,
    zone: row.zone,
    format: (["leaderboard", "rectangle", "sidebar", "mobile-banner"].includes(
      row.format,
    )
      ? row.format
      : "leaderboard") as AdFormat,
    enabled: row.enabled,
    imageUrl: row.imageUrl ?? null,
    targetUrl: row.targetUrl ?? null,
    htmlSnippet: row.htmlSnippet ?? null,
    adsenseSlot: row.adsenseSlot ?? null,
    position: row.position ?? 0,
  };
}

export async function getPlacementsForZone(
  zone: string,
): Promise<AdPlacementView[]> {
  try {
    const rows = await prisma.adPlacement.findMany({
      where: { zone, enabled: true },
      orderBy: { position: "asc" },
    });
    return rows.map(fromRow);
  } catch {
    return [];
  }
}

export async function getAllPlacements(): Promise<AdPlacementView[]> {
  try {
    const rows = await prisma.adPlacement.findMany({
      orderBy: [{ zone: "asc" }, { position: "asc" }],
    });
    return rows.map(fromRow);
  } catch {
    return [];
  }
}
