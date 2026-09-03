import type { FaqItem } from "@/lib/seo";

/**
 * File-size compressors. Image/JPEG/PNG run fully in the browser (Canvas API).
 * GIF/video/audio route through the server conversion service
 * (see `@/lib/convert/server`) and show a setup panel until it is configured.
 */
export type CompressEngine = "image" | "server";

export type CompressToolDef = {
  slug: string;
  name: string;
  h1: string;
  /** "gif-compress" | "video-compress" | "audio-compress" for server ops. */
  serverOp?: "gif-compress" | "video-compress" | "audio-compress";
  engine: CompressEngine;
  category: "image" | "video-audio" | "gif";
  description: string;
  longDescription: string;
  accept: string;
  faq: FaqItem[];
  metaTitle: string;
  metaDescription: string;
  featured?: boolean;
};

const BRAND = "ConvertFlow";

function faq(name: string, extra: FaqItem[], server: boolean): FaqItem[] {
  return [
    ...extra,
    {
      question: `Is ${name} free?`,
      answer: `Yes — ${name} is free with no account, no watermark, and no file-count limit.`,
    },
    server
      ? {
          question: "Where is my file processed?",
          answer:
            "On a secure server that compresses the file and then deletes it immediately. Nothing is stored.",
        }
      : {
          question: "Are my files uploaded?",
          answer:
            "No. The compression runs entirely in your browser with the Canvas API. Your files never leave your device.",
        },
    {
      question: "Will quality drop?",
      answer:
        "You control it. A higher quality setting keeps the file closer to the original; a lower setting makes it smaller. Preview the output size before you download.",
    },
  ];
}

function def(
  d: Omit<CompressToolDef, "metaTitle" | "metaDescription" | "faq"> & {
    faqExtra?: FaqItem[];
  },
): CompressToolDef {
  const { faqExtra, ...rest } = d;
  return {
    ...rest,
    metaTitle: `${d.name} — Free Online ${d.name.replace(" Compressor", "")} Compressor | ${BRAND}`,
    metaDescription: `${d.description} 100% free, ${
      d.engine === "image" ? "private, and browser-based" : "fast, and secure"
    } — no watermark, no sign-up.`,
    faq: faq(d.name, faqExtra ?? [], d.engine === "server"),
  };
}

export const COMPRESS_TOOLS: CompressToolDef[] = [
  def({
    slug: "image-compressor",
    name: "Image Compressor",
    h1: "Compress an image",
    engine: "image",
    category: "image",
    description:
      "Shrink JPG, PNG, and WebP images with a quality slider or a target file size.",
    longDescription:
      "<p>Drop images in and the tool re-encodes each one in your browser — adjust the quality slider, cap the maximum width/height, or set a target size in KB and let it find the right quality automatically. JPG and WebP compress the most; PNG benefits most from resizing or switching format.</p>",
    accept:
      "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    faqExtra: [
      {
        question: "Which formats can I compress?",
        answer:
          "JPG/JPEG, PNG, and WebP. You can also switch the output format (e.g. PNG to WebP) for a much smaller file.",
      },
    ],
    featured: true,
  }),
  def({
    slug: "jpeg-compressor",
    name: "JPEG Compressor",
    h1: "Compress a JPEG",
    engine: "image",
    category: "image",
    description:
      "Reduce JPG / JPEG file size with adjustable quality, in your browser.",
    longDescription:
      "<p>JPEG uses lossy compression, so lowering the quality a little removes detail your eye won't miss and cuts the file size sharply. Set a quality level or a target size, optionally resize, and download. Nothing is uploaded.</p>",
    accept: "image/jpeg,.jpg,.jpeg",
    faqExtra: [
      {
        question: "What quality should I pick?",
        answer:
          "75–85% is the sweet spot for photos on the web — visually near-identical at roughly half the size. Drop to 60% for thumbnails.",
      },
    ],
    featured: true,
  }),
  def({
    slug: "png-compressor",
    name: "PNG Compressor",
    h1: "Compress a PNG",
    engine: "image",
    category: "image",
    description:
      "Shrink PNG images by reducing colours and resizing — browser-based.",
    longDescription:
      "<p>PNG is lossless, so the biggest wins come from reducing the colour palette and scaling the image down. This tool does both locally, and can also export the image as WebP — often 60–80% smaller than PNG with no visible difference.</p>",
    accept: "image/png,.png",
    faqExtra: [
      {
        question: "Why is my PNG still large?",
        answer:
          "Photographic PNGs don't compress well. Either resize it, reduce colours, or export as WebP/JPG for a dramatic size cut.",
      },
    ],
  }),
  def({
    slug: "gif-compressor",
    name: "GIF Compressor",
    h1: "Compress a GIF",
    serverOp: "gif-compress",
    engine: "server",
    category: "gif",
    description:
      "Reduce animated GIF file size by optimising frames and colours.",
    longDescription:
      "<p>Animated GIFs are heavy because every frame stores its own pixels. The server pass removes redundant frame data, trims the colour table, and can scale the animation down — often halving the size with little visible change.</p>",
    accept: "image/gif,.gif",
    faqExtra: [
      {
        question: "Does the animation still play?",
        answer:
          "Yes. Frame timing and loop settings are preserved; only redundant pixel data and unused colours are removed.",
      },
    ],
  }),
  def({
    slug: "video-compressor",
    name: "Video Compressor",
    h1: "Compress a video",
    serverOp: "video-compress",
    engine: "server",
    category: "video-audio",
    description:
      "Make MP4, MOV, WebM, and other videos smaller with a quality target.",
    longDescription:
      "<p>Video is re-encoded on the server with a modern codec at the bitrate/quality you choose. A lower quality target means a much smaller file — ideal for email, messaging, or faster uploads. The source is deleted right after processing.</p>",
    accept:
      "video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.mkv,.avi,.m4v",
    faqExtra: [
      {
        question: "What formats are supported?",
        answer:
          "MP4, MOV, WebM, MKV, AVI, and M4V in — MP4 (H.264) out, which plays everywhere.",
      },
      {
        question: "How much smaller will it be?",
        answer:
          "Typically 40–70% smaller, depending on the source bitrate and the quality target you set.",
      },
    ],
    featured: true,
  }),
  def({
    slug: "mp3-compressor",
    name: "MP3 Compressor",
    h1: "Compress an MP3",
    serverOp: "audio-compress",
    engine: "server",
    category: "video-audio",
    description:
      "Lower the bitrate of MP3 files to shrink them for sharing or storage.",
    longDescription:
      "<p>The MP3 is re-encoded at a lower bitrate on the server. For speech, 64–96&nbsp;kbps is plenty; for music, 128–160&nbsp;kbps stays clean while cutting size. The upload is deleted immediately after.</p>",
    accept: "audio/mpeg,.mp3",
  }),
  def({
    slug: "wav-compressor",
    name: "WAV Compressor",
    h1: "Compress a WAV",
    serverOp: "audio-compress",
    engine: "server",
    category: "video-audio",
    description:
      "Convert bulky uncompressed WAV audio into a compact MP3.",
    longDescription:
      "<p>WAV is uncompressed, so files are enormous. The server converts it to MP3 at a bitrate you choose — usually a 5–10× size reduction with no audible difference for most listening.</p>",
    accept: "audio/wav,audio/x-wav,.wav",
  }),
];

export function compressToolBySlug(slug: string): CompressToolDef | undefined {
  return COMPRESS_TOOLS.find((t) => t.slug === slug);
}

export const COMPRESS_CATEGORIES = [
  { id: "image", label: "Image" },
  { id: "gif", label: "GIF" },
  { id: "video-audio", label: "Video & audio" },
] as const;
