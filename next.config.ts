import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Prevents the site being framed/click-jacked (pairs with X-Frame-Options).
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
  },
  {
    // camera=(self) keeps the Scan-to-PDF tool working on our own origin.
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Hide the framework fingerprint.
  poweredByHeader: false,

  // This project lives beside another app that has its own lockfile; pin the root.
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },

  images: {
    remotePatterns: [
      // Vercel Blob storage (uploaded images in production).
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Allow any other https image URL an editor pastes in the admin.
      { protocol: "https", hostname: "**" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Never index or cache the admin panel or internal API in any shared cache.
        source: "/(admin|api)/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
