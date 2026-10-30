import type { FaqItem } from "@/lib/seo";
import type { HowToStep } from "@/components/tool/seo-blocks";

/**
 * Standalone media tools with their own page (/video/[slug], /image/[slug]).
 * Each entry holds the page's SEO content; the interactive widget is picked by
 * `widget`. Sitemap, /tools, homepage search and llms.txt read this list.
 */

export type MediaSection = "video" | "image";
export type MediaWidget = "video-cutter" | "background-remover";

export type MediaToolDef = {
  slug: string;
  section: MediaSection;
  widget: MediaWidget;
  name: string;
  h1: string;
  metaTitle: string;
  /** ~140 chars; benefits within the first 120. */
  metaDescription: string;
  description: string;
  keywords: string[];
  /** Short tool-card badges. */
  cardFrom: string;
  cardTo: string;
  quickAnswer: string;
  steps: HowToStep[];
  featureList: string[];
  longDescription: string;
  faq: FaqItem[];
  related: { href: string; name: string; hint: string }[];
};

export const MEDIA_TOOLS: MediaToolDef[] = [
  {
    slug: "video-cutter",
    section: "video",
    widget: "video-cutter",
    name: "Video Cutter",
    h1: "Video Cutter: Cut, Resize & Add Captions to Any Video",
    metaTitle: "Video Cutter – Cut, Resize & Add Captions (Free)",
    metaDescription:
      "Free, no upload: cut any part of a long video, resize it for Reels & Shorts (9:16) and auto-add captions in English, Nepali, Hindi & more.",
    description:
      "Cut any part of a video — from a 2-second moment to an hour of a 2-hour recording — resize it for YouTube, Reels, Shorts or TikTok, and add auto-generated captions in English, Nepali, Hindi and 30+ languages. Your video never leaves your device.",
    keywords: [
      "video cutter",
      "cut video online",
      "trim video online",
      "cut part of a video",
      "extract clip from video",
      "cut long video",
      "video clipper",
      "cut mp4 online",
      "trim video without losing quality",
      "cut video without uploading",
      "extract audio from video clip",
      "resize video for reels",
      "9:16 video converter",
      "video resizer online",
      "auto caption generator",
      "add subtitles to video",
      "nepali caption generator",
      "hindi subtitle generator",
      "srt subtitle generator",
      "translate subtitles",
    ],
    cardFrom: "VIDEO",
    cardTo: "CLIP",
    quickAnswer:
      "Add your video, type the start and end time (for example 1:01:00 to 1:03:00), pick a size such as 9:16 for Reels and Shorts, optionally generate captions in English, Nepali, Hindi or another language, and press Cut & Download. Free, no sign-up, and the video is never uploaded.",
    steps: [
      {
        name: "Add your video",
        text: "Drop a video file onto the tool — MP4, MOV, WebM, MKV or M4V, even several hours long. It opens in your browser; nothing is uploaded.",
      },
      {
        name: "Set the start and end time",
        text: "Type the times (h:mm:ss, mm:ss or seconds), drag the sliders, or play the video and tap “Use current time”. Preview the clip to check it.",
      },
      {
        name: "Pick a size and shape",
        text: "Keep the original, or choose 16:9 (YouTube), 9:16 (Reels, Shorts, TikTok), 1:1 or 4:5, and a resolution from 1080p to 360p. Crop to fill, or fit the whole video with blurred or black bars.",
      },
      {
        name: "Add captions (optional)",
        text: "Choose the spoken language and press Generate captions. Edit any line, translate the captions into another language, then burn them into the video or download an SRT/VTT file.",
      },
      {
        name: "Cut and download",
        text: "Press Cut & Download. The clip is created on your device and saved in the same format as your video.",
      },
    ],
    featureList: [
      "Cut clips from videos several hours long",
      "Exact start and end times (h:mm:ss)",
      "Fast lossless cut or frame-exact cut",
      "Preview the clip before downloading",
      "Audio-only (M4A) export",
      "Resize to 16:9, 9:16, 1:1 or 4:5 and 1080p–360p",
      "Auto captions in 30+ languages incl. Nepali and Hindi",
      "Translate captions into another language",
      "Burn captions into the video or export SRT/VTT",
      "MP4, MOV, WebM and MKV",
      "Private — runs in the browser, no upload",
    ],
    longDescription: `
<p>Long recordings — a 2-hour lecture, a livestream, a webinar, a game session or a phone video — usually contain only a few minutes you actually need. This <strong>video cutter</strong> lets you cut out exactly that part, whether it is a 2-second reaction or a 1-hour section, and save it as a new file.</p>
<h3>Why this video cutter is different</h3>
<ul>
<li><strong>Handles very long videos</strong> — it reads only the part of the file it needs, so even multi-hour, multi-gigabyte videos open quickly.</li>
<li><strong>No upload, no waiting</strong> — the cut happens in your browser. A 2 GB video doesn’t have to travel to a server and back.</li>
<li><strong>No quality loss in Fast mode</strong> — the original video and audio are copied as-is, not re-compressed.</li>
<li><strong>Frame-exact when you need it</strong> — Exact mode starts the clip on the precise frame you choose.</li>
<li><strong>Precise times</strong> — type 1:01:00 to 1:03:00 instead of dragging a tiny slider for minutes.</li>
<li><strong>No watermark, no sign-up, no limits.</strong></li>
</ul>
<h3>Fast vs Exact: which should I use?</h3>
<p>Videos are stored as “keyframes” (full pictures every few seconds) plus small changes in between. <strong>Fast</strong> mode copies the original data, so the clip has to begin on a keyframe — it may start up to a few seconds before your chosen time, but it’s instant and keeps 100% of the quality. <strong>Exact</strong> mode re-encodes the clip so it starts and ends exactly where you set; it takes longer and uses your device’s video encoder.</p>
<h3>Resize for YouTube, Reels, Shorts and TikTok</h3>
<p>Choose a shape — <strong>16:9</strong> for YouTube, <strong>9:16</strong> for Instagram Reels, YouTube Shorts and TikTok, <strong>1:1</strong> for square posts or <strong>4:5</strong> for Instagram portrait — and a resolution from 1080p down to 360p for smaller files. “Crop to fill” zooms in to fill the frame; “Fit + blur bars” keeps the whole picture with a soft blurred background, the popular look for turning a landscape video into a vertical one.</p>
<h3>Auto captions in English, Nepali, Hindi and 30+ languages</h3>
<p>The <strong>caption generator</strong> listens to the clip and writes timed captions using the Whisper speech model, running privately in your browser. It supports English, Nepali, Hindi, Bengali, Urdu, Tamil, Spanish, Arabic, Portuguese, French, Indonesian, Chinese, Japanese and many more. Every line is editable, so you can fix names or spelling before using them. Then <strong>translate the captions</strong> into another language, <strong>burn them into the video</strong> so they show on every app, or download an <strong>SRT</strong> or <strong>VTT</strong> subtitle file for YouTube and video editors.</p>
<p>Captions are created on your device, so the first time you use them your browser downloads the speech model once (73 MB for Standard, 237 MB for Accurate). Accurate is used for Nepali, Hindi and other South Asian languages because it writes them in the correct script. Translation uses your browser’s built-in translator where available, otherwise an in-browser AI model — for some languages, such as Nepali, the translation can be basic, so please review it.</p>
<h3>Which videos can I cut?</h3>
<p>Any video file on your phone or computer that you have the right to use — camera and phone recordings, screen recordings, exported projects, or downloads you are allowed to edit. ConvertFlow does not download videos from YouTube or other websites.</p>
`.trim(),
    faq: [
      {
        question: "How do I cut a specific part out of a long video?",
        answer:
          "Add the video, type the start and end time — for example 1:01:00 and 1:03:00 — and press Cut & Download. You can also play the video and tap “Use current time” to set each point.",
      },
      {
        question: "Can it handle a 2-hour video?",
        answer:
          "Yes. The tool reads only the part of the file it needs, so long, large videos work. Very long clips (an hour or more) are created in your device’s memory, so a computer handles them more comfortably than an older phone.",
      },
      {
        question: "Does cutting reduce the video quality?",
        answer:
          "Not in Fast mode — the original video and audio are copied without re-encoding. Exact mode re-encodes the clip at high quality, which can change it slightly.",
      },
      {
        question: "Why does my clip start a little before my start time?",
        answer:
          "In Fast mode the clip must begin on a keyframe, which can be a few seconds before your chosen time. Switch to Exact mode for a frame-perfect start.",
      },
      {
        question: "Which video formats are supported?",
        answer:
          "MP4, MOV, M4V, WebM and MKV. The clip is saved in the same format as your video, or as M4A if you choose audio only.",
      },
      {
        question: "Can I cut a video I downloaded from YouTube?",
        answer:
          "You can cut any video file on your device that you have the right to use. ConvertFlow does not download videos from YouTube or any other website, and you are responsible for respecting the owner’s copyright.",
      },
      {
        question: "Is my video uploaded?",
        answer:
          "No. The video is opened and cut entirely in your browser. It never leaves your device, so even private recordings stay private.",
      },
      {
        question: "How do I resize a video for Instagram Reels, YouTube Shorts or TikTok?",
        answer:
          "Choose 9:16 under Size & shape. Pick “Crop to fill” to fill the vertical frame, or “Fit + blur bars” to keep the whole landscape video with a blurred background, then press Cut & Download.",
      },
      {
        question: "Can it generate captions in Nepali and Hindi?",
        answer:
          "Yes. Choose Nepali or Hindi as the spoken language and press Generate captions. The Accurate speech model is used for these languages. Results are usually good but not perfect, so review and edit the lines before using them.",
      },
      {
        question: "Can I translate captions into another language?",
        answer:
          "Yes. After generating captions, choose a language under “Translate captions to” and press Translate. You can switch back to the original captions at any time.",
      },
      {
        question: "Should I burn in captions or download an SRT file?",
        answer:
          "Burn them in for Instagram, TikTok, WhatsApp and other apps — the text becomes part of the video. Download SRT or VTT for YouTube or video editors, where captions can be turned on and off.",
      },
      {
        question: "Can I save only the audio from a clip?",
        answer:
          "Yes. Choose “Audio only (M4A)” before cutting to save just the sound from that part of the video.",
      },
    ],
    related: [
      { href: "/compress/video-compressor", name: "Video Compressor", hint: "Make the clip smaller to share" },
      { href: "/logo/motion-logo-png-maker", name: "Motion Logo PNG Maker", hint: "Transparent logo for video intros" },
      { href: "/tools", name: "All tools", hint: "Converters, PDF and image tools" },
    ],
  },
  {
    slug: "background-remover",
    section: "image",
    widget: "background-remover",
    name: "Background Remover",
    h1: "Background Remover: Remove Image Background Free",
    metaTitle: "Background Remover – Remove Image Background Free (HD PNG)",
    metaDescription:
      "Free, no upload, no watermark: remove image backgrounds with AI in seconds. Get a transparent HD PNG for people, products, pets and logos.",
    description:
      "Remove the background from any photo with AI — people, products, pets, cars or logos — and download a transparent PNG in full resolution. Runs in your browser, so your photos stay private.",
    keywords: [
      "background remover",
      "remove background",
      "remove background from image",
      "remove bg",
      "transparent background",
      "make background transparent",
      "photo background remover",
      "remove white background",
      "background eraser",
      "product photo background remover",
      "change photo background",
      "blur background",
    ],
    cardFrom: "PHOTO",
    cardTo: "PNG",
    quickAnswer:
      "Add a photo and the AI removes the background in about a second (use “Plain color” for logos on white). Keep it transparent or switch to white, a color or a blurred background, then download a full-resolution PNG. Free, no watermark, and your photo is never uploaded.",
    steps: [
      {
        name: "Add your photo",
        text: "Drop a JPG, PNG or WebP photo onto the tool, or tap to choose one. It stays on your device.",
      },
      {
        name: "Choose what’s in the photo",
        text: "“Photo (AI)” works for people, products, pets and cars. “Plain color” instantly removes white or solid backgrounds from logos, signatures and graphics.",
      },
      {
        name: "Pick a new background",
        text: "Keep it transparent, or choose white, black, any color, or a blurred version of the original background. Crop to the subject if you like.",
      },
      {
        name: "Download",
        text: "Download a full-resolution PNG (transparent), WebP or JPG. No watermark and no sign-up.",
      },
    ],
    featureList: [
      "AI background removal for any photo",
      "Works on phones and computers — no GPU needed",
      "Instant plain-color removal for logos",
      "Transparent, white, color or blurred background",
      "Full-resolution PNG, WebP or JPG",
      "No watermark, no sign-up",
      "Private — runs in the browser, no upload",
    ],
    longDescription: `
<p>Removing a background used to mean careful work with an eraser tool. This <strong>background remover</strong> uses AI to find the subject of your photo — a person, product, pet, car or logo — and cut it out cleanly in seconds, giving you a <strong>transparent background PNG</strong> ready for online stores, profile pictures, thumbnails, presentations and designs.</p>
<h3>Why use this background remover?</h3>
<ul>
<li><strong>100% private</strong> — the AI runs inside your browser. Your photo is never uploaded to a server, unlike most background removers.</li>
<li><strong>Full resolution, no watermark</strong> — download the result at the original size, free.</li>
<li><strong>Two modes for better results</strong> — AI for photos of people, products and pets, and an instant color-key mode for logos and graphics on white.</li>
<li><strong>More than transparent</strong> — replace the background with white (great for marketplaces), any brand color, or a soft blur of the original.</li>
<li><strong>Crop to subject</strong> — trim the empty space automatically.</li>
</ul>
<h3>Which mode should I choose?</h3>
<p><strong>Photo (AI)</strong> finds the main subject — a person, product, pet or car — and removes everything around it. It uses a small 4.5 MB AI model that downloads once and runs on any phone or computer in about a second. <strong>Plain color</strong> needs no AI at all — perfect for removing a white background from a logo, signature or screenshot.</p>
<h3>Tips for the best result</h3>
<ul>
<li>Use a photo where the subject is in focus and clearly separated from the background.</li>
<li>For marketplace listings (Amazon, eBay, Etsy, Shopify), pick a white background and JPG.</li>
<li>For logos with white letters inside, use our <a href="/logo/motion-logo-png-maker">Motion Logo PNG Maker</a>, which has extra controls.</li>
</ul>
`.trim(),
    faq: [
      {
        question: "How do I remove the background from a photo?",
        answer:
          "Add your photo, keep “Photo (AI)” selected and wait a moment. The background is removed automatically — then download the transparent PNG.",
      },
      {
        question: "Is this background remover really free?",
        answer:
          "Yes. It is free with no sign-up, no credits and no watermark, and you can download the full-resolution result.",
      },
      {
        question: "Is my photo uploaded to a server?",
        answer:
          "No. The AI model runs in your browser, so your photo never leaves your device. Only the AI model itself is downloaded the first time you use it.",
      },
      {
        question: "Why does the first photo take a little longer?",
        answer:
          "The first time, your browser downloads the small AI model (about 4.5 MB). After that it is reused, so each new photo takes about a second.",
      },
      {
        question: "How do I make a white background for product photos?",
        answer:
          "After the background is removed, choose “White” as the new background and download as JPG. This is the standard format most online marketplaces ask for.",
      },
      {
        question: "Can I remove a white background from a logo?",
        answer:
          "Yes — choose “Plain color”. It removes the white (or any solid color) instantly without AI. For more control, such as recoloring the logo, use the Motion Logo PNG Maker.",
      },
      {
        question: "Does it work on my phone?",
        answer:
          "Yes. Both modes work on phones and computers, and no graphics card is needed. Very large photos are scaled to at most 4096 pixels on the longest side.",
      },
      {
        question: "Can I blur the background instead of removing it?",
        answer:
          "Yes. Choose “Blur” as the background to keep the original scene softly blurred behind the subject, like portrait mode on a phone camera.",
      },
    ],
    related: [
      { href: "/logo/motion-logo-png-maker", name: "Motion Logo PNG Maker", hint: "Transparent logos with recolor & badges" },
      { href: "/compress/png-compressor", name: "PNG Compressor", hint: "Shrink the PNG file size" },
      { href: "/convert/png-to-jpg", name: "PNG to JPG", hint: "Convert the result to JPG" },
    ],
  },
];

export function mediaTool(section: MediaSection, slug: string): MediaToolDef | undefined {
  return MEDIA_TOOLS.find((t) => t.section === section && t.slug === slug);
}

export const mediaToolPath = (t: MediaToolDef) => `/${t.section}/${t.slug}`;
