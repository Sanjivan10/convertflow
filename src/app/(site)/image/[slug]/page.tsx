import type { Metadata } from "next";
import { MediaToolPage, mediaMetadata, mediaStaticParams } from "@/components/media-tool-page";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return mediaStaticParams("image");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return mediaMetadata("image", slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MediaToolPage section="image" slug={slug} />;
}
