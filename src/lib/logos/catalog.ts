import type { FaqItem } from "@/lib/seo";

/**
 * Logo tools (/logo/[slug]). The main feature is the LogoConverter: visitors
 * upload any logo and turn it into a transparent "motion logo" PNG in the
 * browser. Each tool also offers ready-made official brand logo files
 * (SVG + transparent PNG in /public/logos/<brand>/) as a bonus section.
 *
 * Renamed a tool? Add its old slug to `previousSlugs` — next.config.ts
 * permanently redirects it, so search rankings carry over.
 */

export type LogoVariant = {
  id: string;
  label: string;
  /** Short hint shown under the label. */
  hint: string;
  /** Public path without extension; both `.svg` and `.png` exist. */
  file: string;
  /** Size of the static PNG in /public. */
  pngWidth: number;
  pngHeight: number;
  /** Preview this variant on a dark background. */
  dark?: boolean;
};

export type BrandColor = { name: string; hex: string };

export type LogoToolDef = {
  slug: string;
  /** Old URLs that 308-redirect here (keeps SEO when a slug changes). */
  previousSlugs: string[];
  /** Brand whose official logo files are offered as a bonus. */
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
  /** Logo on a solid background, used by the "Try a sample" button. */
  sampleUrl: string;
  variants: LogoVariant[];
  colors: BrandColor[];
  /** Server-rendered HTML for the "About" section. */
  longDescription: string;
  faq: FaqItem[];
  ogImage: string;
};

const AM = "/logos/alight-motion";
const WORDMARK = { pngWidth: 2000, pngHeight: 490 };
const ICON = { pngWidth: 1024, pngHeight: 1024 };

export const LOGO_TOOLS: LogoToolDef[] = [
  {
    slug: "motion-logo-png-maker",
    previousSlugs: ["alight-motion-logo-png"],
    brand: "Alight Motion",
    name: "Motion Logo PNG Maker",
    h1: "Motion Logo PNG Maker",
    metaTitle: "Motion Logo PNG Maker – Turn Any Logo into a Transparent PNG",
    // 140 chars — benefits inside the first 120 (what Google shows on mobile).
    metaDescription:
      "Free, private, no sign-up: turn any logo into a transparent HD PNG. Remove background, trim & resize up to 4K, then use it in Alight Motion.",
    description:
      "Turn any logo into a transparent PNG for Alight Motion and other video editors — remove the background, recolor, add a badge, and export up to 4K.",
    keywords: [
      "motion logo png",
      "motion logo png maker",
      "logo to png",
      "make logo transparent",
      "remove logo background",
      "transparent logo png",
      "logo png for alight motion",
      "alight motion logo png",
      "alight motion logo transparent",
      "alight motion logo png hd",
      "mentahan logo alight motion",
    ],
    owner: "Alight Creative, Inc.",
    officialSite: "https://alightmotion.com",
    sampleUrl: `${AM}/alight-motion-logo-sample-white-bg.jpg`,
    ogImage: `${AM}/alight-motion-logo-og.png`,
    variants: [
      { id: "color", label: "Original color", hint: "For light backgrounds", file: `${AM}/alight-motion-logo`, ...WORDMARK },
      { id: "white-text", label: "White text", hint: "For black / dark backgrounds", file: `${AM}/alight-motion-logo-white-text`, dark: true, ...WORDMARK },
      { id: "white", label: "All white", hint: "Single-color white", file: `${AM}/alight-motion-logo-white`, dark: true, ...WORDMARK },
      { id: "black", label: "All black", hint: "Single-color black", file: `${AM}/alight-motion-logo-black`, ...WORDMARK },
      { id: "icon", label: "Icon only", hint: "The swirl symbol", file: `${AM}/alight-motion-icon`, ...ICON },
      { id: "icon-circle", label: "Circle icon", hint: "App-style round icon", file: `${AM}/alight-motion-icon-circle`, ...ICON },
    ],
    colors: [
      { name: "Navy (wordmark)", hex: "#1E428A" },
      { name: "Cyan (swirl)", hex: "#2AB8DD" },
      { name: "Mint green (swirl)", hex: "#66F9A8" },
      { name: "Dark navy (icon)", hex: "#1D2238" },
    ],
    longDescription: `
<p>A <strong>motion logo PNG</strong> is a logo saved as a PNG with a transparent background, so it can float over video in apps like <strong>Alight Motion</strong>, CapCut, Premiere Pro or After Effects. Most logos people have are JPGs or screenshots with a white or colored box behind them — drop one of those into a video and the box shows. This tool removes that box and gives you a clean, transparent, HD logo in seconds.</p>
<h3>Why use this Motion Logo PNG Maker?</h3>
<ul>
<li><strong>Works with any logo</strong> — PNG, JPG, WebP, SVG, GIF or BMP, including screenshots.</li>
<li><strong>Smart background removal</strong> — removes the background color everywhere, including the holes inside letters like “o”, “a” and “g”. Want to keep white parts inside your logo? Switch to “Keep white inside logo”.</li>
<li><strong>Clean edges</strong> — edge pixels are softened and the old background color is removed from them, so there is no white halo on dark videos.</li>
<li><strong>Ready for motion videos</strong> — recolor to white or black for overlays, or put the logo on a circle or rounded badge for intros and watermarks.</li>
<li><strong>HD and 4K</strong> — export from 64 px up to 6000 px wide as PNG, WebP or JPG.</li>
<li><strong>100% private</strong> — everything happens in your browser. Your logo is never uploaded.</li>
</ul>
<h3>How to add your logo PNG in Alight Motion</h3>
<p>Open your project in Alight Motion, tap the <strong>+</strong> button, choose <strong>Image &amp; Video</strong> (Media), and select the PNG you downloaded. The transparent background is kept, so only your logo appears on the video. Then use keyframes to animate it — fade, scale or move it to make an animated logo intro.</p>
`.trim(),
    faq: [
      {
        question: "How do I make my logo a transparent PNG?",
        answer:
          "Upload your logo above, keep “Remove background (recommended)” selected, and press Download with PNG selected. The background around your logo is removed and the file is saved as a transparent PNG.",
      },
      {
        question: "Will it remove white parts inside my logo?",
        answer:
          "Only if you want it to. The recommended mode removes the background color everywhere, which also clears the holes inside letters. If your logo has white parts that must stay, choose “Keep white inside logo” — it only removes background connected to the image edges.",
      },
      {
        question: "Some background is still left. What should I do?",
        answer:
          "Tap the leftover background on the small original image to pick its exact color, then raise the Strength slider a little. If parts of your logo start to disappear, lower it again.",
      },
      {
        question: "How do I use the PNG logo in Alight Motion?",
        answer:
          "In your Alight Motion project tap +, choose Image & Video, and pick the PNG. The transparent background is kept automatically. Add keyframes to animate it into a logo intro.",
      },
      {
        question: "Can I get my logo in HD or 4K?",
        answer:
          "Yes. Choose 2048 px, 4K (4096 px) or type any width up to 6000 px. For the sharpest result, upload the largest version of your logo you have, or an SVG.",
      },
      {
        question: "Can I make my logo white or black for videos?",
        answer:
          "Yes. In step 3 choose White, Black or any custom color. Every visible part of the logo is recolored while the background stays transparent — ideal for watermarks and overlays.",
      },
      {
        question: "Where can I download the official Alight Motion logo PNG?",
        answer:
          "Scroll to “Official Alight Motion logo PNG” below. It has the original logo plus white-text, all-white, all-black, icon and circle versions as transparent PNG and SVG.",
      },
      {
        question: "Is this tool free and private?",
        answer:
          "Yes. It is free with no sign-up and no watermark, and your logo is processed entirely in your browser — it is never uploaded to any server.",
      },
    ],
  },
];

export function logoToolBySlug(slug: string): LogoToolDef | undefined {
  return LOGO_TOOLS.find((t) => t.slug === slug);
}
