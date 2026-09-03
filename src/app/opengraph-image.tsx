import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${siteConfig.name} — Free Online File Converter`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #0c4a6e 0%, #0f172a 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 34, opacity: 0.8 }}>{siteConfig.name}</div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            marginTop: 24,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Convert files right in your browser
        </div>
        <div style={{ fontSize: 30, marginTop: 28, opacity: 0.75 }}>
          Free · Private · No uploads · No watermarks
        </div>
      </div>
    ),
    size,
  );
}
