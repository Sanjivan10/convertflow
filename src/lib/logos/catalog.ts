import type { FaqItem } from "@/lib/seo";

/**
 * Brand logo download tools (/logo/[slug]). Each logo ships as static SVG +
 * transparent PNG files in /public/logos/<brand>/, and the LogoStudio
 * component re-renders them in the browser at any size / background / format.
 *
 * To add a brand: drop its SVG variants + PNGs in /public/logos/<brand>/ and
 * add an entry below. Sitemap, /tools and the homepage search pick it up.
 */

export type LogoVariant = {
  id: string;
  label: string;
  /** Short hint shown under the label. */
  hint: string;
  /** Public path without extension; both `.svg` and `.png` exist. */
  file: string;
  /** viewBox size of the SVG — sets the aspect ratio. */
  width: number;
  height: number;
  /** Size of the static PNG in /public. */
  pngWidth: number;
  pngHeight: number;
  /** Preview this variant on a dark background. */
  dark?: boolean;
};

export type BrandColor = { name: string; hex: string };

export type LogoToolDef = {
  slug: string;
  brand: string;
  /** Short card / breadcrumb name. */
  name: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  description: string;
  keywords: string[];
  owner: string;
  officialSite: string;
  variants: LogoVariant[];
  colors: BrandColor[];
  /** Server-rendered HTML for the "About" section. */
  longDescription: string;
  faq: FaqItem[];
  ogImage: string;
};

const AM = "/logos/alight-motion";
const WORDMARK = { width: 626.49, height: 153.48, pngWidth: 2000, pngHeight: 490 };
const ICON = { width: 1, height: 1, pngWidth: 1024, pngHeight: 1024 };

export const LOGO_TOOLS: LogoToolDef[] = [
  {
    slug: "alight-motion-logo-png",
    brand: "Alight Motion",
    name: "Alight Motion Logo PNG",
    h1: "Alight Motion Logo PNG",
    metaTitle: "Alight Motion Logo PNG – Transparent HD Download (Free)",
    metaDescription:
      "Download the Alight Motion logo PNG with a transparent background in HD, up to 4096px. Get the icon, white, black and circle versions as PNG, SVG, JPG or WebP.",
    description:
      "Download the Alight Motion logo as a transparent PNG in any size — plus white, black, icon and circle versions, SVG, and the official brand colors.",
    keywords: [
      "alight motion logo png",
      "alight motion logo transparent",
      "alight motion logo png hd",
      "alight motion logo without background",
      "alight motion logo black background",
      "alight motion logo white",
      "alight motion icon png",
      "alight motion logo circle",
      "alight motion logo svg",
      "mentahan logo alight motion",
      "alight motion logo download",
    ],
    owner: "Alight Creative, Inc.",
    officialSite: "https://alightmotion.com",
    ogImage: `${AM}/alight-motion-logo-og.png`,
    variants: [
      {
        id: "color",
        label: "Original color",
        hint: "Official colors, for light backgrounds",
        file: `${AM}/alight-motion-logo`,
        ...WORDMARK,
      },
      {
        id: "white-text",
        label: "White text",
        hint: "For black / dark backgrounds",
        file: `${AM}/alight-motion-logo-white-text`,
        dark: true,
        ...WORDMARK,
      },
      {
        id: "white",
        label: "All white",
        hint: "Single-color white version",
        file: `${AM}/alight-motion-logo-white`,
        dark: true,
        ...WORDMARK,
      },
      {
        id: "black",
        label: "All black",
        hint: "Single-color black version",
        file: `${AM}/alight-motion-logo-black`,
        ...WORDMARK,
      },
      {
        id: "icon",
        label: "Icon only",
        hint: "The swirl symbol, no text",
        file: `${AM}/alight-motion-icon`,
        ...ICON,
      },
      {
        id: "icon-circle",
        label: "Circle icon",
        hint: "App-style round icon",
        file: `${AM}/alight-motion-icon-circle`,
        ...ICON,
      },
    ],
    colors: [
      { name: "Navy (wordmark)", hex: "#1E428A" },
      { name: "Cyan (swirl)", hex: "#2AB8DD" },
      { name: "Mint green (swirl)", hex: "#66F9A8" },
      { name: "Dark navy (icon background)", hex: "#1D2238" },
    ],
    longDescription: `
<p>Alight Motion is a popular mobile app for motion graphics, animation, video editing and visual effects on Android, iPhone and iPad, made by <strong>Alight Creative, Inc.</strong> Its logo pairs the words <strong>“Alight Motion”</strong> in navy blue with a curved, motion-blur swirl that fades from cyan to mint green.</p>
<p>The logo files on this page are rebuilt from the official vector logo on <a href="https://alightmotion.com" rel="nofollow noopener" target="_blank">alightmotion.com</a> — the shapes and colors are unchanged, so the <strong>Alight Motion logo PNG</strong> stays sharp at any size. The white, black, icon and circle versions are simple recolors and crops of that same artwork.</p>
<h3>Which Alight Motion logo version should I use?</h3>
<ul>
<li><strong>Original color</strong> — the standard logo for white or light backgrounds.</li>
<li><strong>White text</strong> — keeps the colored swirl but turns the text white, so the logo reads clearly on a <strong>black background</strong>, dark thumbnails and video intros.</li>
<li><strong>All white / all black</strong> — one-color versions for watermarks, stickers, merch mockups and busy photos.</li>
<li><strong>Icon only</strong> — just the swirl symbol, ideal as an <strong>Alight Motion icon PNG</strong> for profile pictures, buttons and small spaces.</li>
<li><strong>Circle icon</strong> — the swirl on a round dark badge, like an app icon. Great for social media and YouTube end screens.</li>
</ul>
<h3>Transparent PNG, SVG, JPG or WebP?</h3>
<p>Choose <strong>PNG</strong> for a transparent background (the “mentahan logo” or logo without background most editors need). Choose <strong>SVG</strong> if you need an infinitely scalable vector for print or design apps. <strong>JPG</strong> always has a solid background and the smallest file size, and <strong>WebP</strong> is best for websites.</p>
`.trim(),
    faq: [
      {
        question: "How do I download the Alight Motion logo PNG with a transparent background?",
        answer:
          "Pick a version above, leave the background on “Transparent”, choose PNG and press Download. The file has no background, so you can place it on any video, thumbnail or design.",
      },
      {
        question: "Can I get the Alight Motion logo in HD or 4K?",
        answer:
          "Yes. Choose any width up to 6000 pixels — 4096 px is a 4K-ready logo. Because every file is rendered from the vector original, it stays sharp at every size. For unlimited size, download the SVG.",
      },
      {
        question: "Is there an Alight Motion logo for a black background?",
        answer:
          "Yes — use the “White text” version. It keeps the colored swirl and makes the text white so it stays readable on black. You can also set the background to black before downloading to get a ready-made logo on black.",
      },
      {
        question: "What are the Alight Motion logo colors?",
        answer:
          "The wordmark is navy blue #1E428A and the swirl is a gradient from cyan #2AB8DD to mint green #66F9A8. The circle icon uses a dark navy background, #1D2238. Click any color above to copy its hex code.",
      },
      {
        question: "Where can I get the Alight Motion icon or circle logo?",
        answer:
          "Choose “Icon only” for the swirl symbol on its own, or “Circle icon” for the round app-style badge. Both download as square PNG, JPG, WebP or SVG files.",
      },
      {
        question: "What does “mentahan logo Alight Motion” mean?",
        answer:
          "It is Indonesian for a raw Alight Motion logo asset — usually a transparent PNG you can import into an editing project. The transparent PNG on this page is exactly that.",
      },
      {
        question: "Can I use the Alight Motion logo in my videos or projects?",
        answer:
          "The Alight Motion name and logo are trademarks of Alight Creative, Inc. It is generally fine to use the logo to refer to the app — for example in tutorials, reviews or a “made with Alight Motion” credit. Do not use it as your own branding or in a way that suggests Alight Creative endorses you, and check Alight Creative’s terms for commercial use.",
      },
      {
        question: "Is this tool free?",
        answer:
          "Yes. Every version, size and format is free to download with no sign-up and no watermark. The files are created in your browser, so nothing is uploaded.",
      },
    ],
  },
];

export function logoToolBySlug(slug: string): LogoToolDef | undefined {
  return LOGO_TOOLS.find((t) => t.slug === slug);
}
