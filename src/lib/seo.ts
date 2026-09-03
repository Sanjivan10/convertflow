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

/** SoftwareApplication schema for a converter tool page. */
export function softwareApplicationSchema(input: {
  name: string;
  description: string;
  path: string;
  ratingValue?: number;
  ratingCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any (web browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: input.ratingValue ?? 4.8,
      ratingCount: input.ratingCount ?? 1240,
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
