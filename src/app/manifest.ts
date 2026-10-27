import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

// Web app manifest: lets visitors install ConvertFlow as an app
// ("Install app" / "Add to Home Screen").
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${siteConfig.name} — Free Online File Converter`,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "All tools", url: "/tools" },
      { name: "PDF tools", url: "/tools?category=pdf" },
      { name: "Compress", url: "/tools?category=compress" },
    ],
  };
}
