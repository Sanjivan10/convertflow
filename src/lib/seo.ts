import type { Metadata } from "next";
import { siteConfig, absoluteUrl } from "@/lib/site";

export type FaqItem = { question: string; answer: string };

type BuildMetadataInput = {
  title: string;
  description: string;
  /** Path beginning with "/" — used for the canonical URL. */
  path: string;
  /** Absolute OG image URL. Falls back to the dynamic /opengraph-image route. */
  ogImage?: string;
  keywords?: string[];
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
};

/**
 * Single source of truth for per-route metadata: title template, canonical tag,
 * OpenGraph, Twitter card, and robots directives.
 */
export function buildMetadata({
  title,
  description,
  path,
  ogImage,
  keywords,
  type = "website",
  publishedTime,
  modifiedTime,
  noindex,
}: BuildMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const image = ogImage ?? absoluteUrl("/opengraph-image");

  // Pages own their full <title>. Append the brand once, and never twice.
  const brand = siteConfig.name;
  const absoluteTitle = title.includes(brand) ? title : `${title} | ${brand}`;

  return {
    title: { absolute: absoluteTitle },
    description,
    keywords,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      title: absoluteTitle,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: absoluteTitle,
      description,
      images: [image],
      creator: siteConfig.twitter,
    },
  };
}

/** Serialise a schema object for a <script type="application/ld+json"> tag. */
export function jsonLdScript(data: object): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/icon.png"),
    sameAs: [] as string[],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/tools?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * SoftwareApplication + WebApplication schema for a tool page.
 * `aggregateRating` is emitted ONLY when a real rating count is supplied —
 * synthetic ratings violate Google's structured-data guidelines.
 */
export function softwareApplicationSchema(input: {
  name: string;
  description: string;
  path: string;
  ratingValue?: number;
  ratingCount?: number;
  featureList?: string[];
}) {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "WebApplication"],
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires JavaScript. Works in Chrome, Edge, Firefox, Safari.",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.publisher,
      url: siteConfig.url,
    },
  };
  if (input.featureList?.length) base.featureList = input.featureList;
  if (input.ratingCount && input.ratingCount > 0 && input.ratingValue) {
    base.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: input.ratingValue,
      ratingCount: input.ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return base;
}

/** HowTo schema — Google shows this as a rich result for "how to …" queries. */
export function howToSchema(input: {
  name: string;
  description: string;
  path: string;
  steps: { name: string; text: string }[];
  totalTime?: string; // ISO 8601 duration, e.g. "PT1M"
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    totalTime: input.totalTime ?? "PT1M",
    estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
    supply: [],
    tool: [
      {
        "@type": "HowToTool",
        name: `A web browser and ${siteConfig.name}`,
      },
    ],
    step: input.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${absoluteUrl(input.path)}#step-${i + 1}`,
    })),
  };
}

/** Marks a short answer paragraph as voice-assistant / AI readable. */
export function speakableSchema(path: string, cssSelectors: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": absoluteUrl(path),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: cssSelectors,
    },
  };
}

export function faqPageSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function articleSchema(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    image: input.image ? [input.image] : [absoluteUrl("/opengraph-image")],
    datePublished: input.publishedTime,
    dateModified: input.modifiedTime ?? input.publishedTime,
    author: {
      "@type": "Person",
      name: input.authorName ?? siteConfig.publisher,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.publisher,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon.png"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(input.path),
    },
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}
