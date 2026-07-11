import { EmbedWall } from "@/components/EmbedWall";

// Carousel variant of the embed, selected via data-gavah-layout="carousel".
export const revalidate = 300;

export default function EmbedCarouselPage({ params }: { params: { slug: string } }) {
  return <EmbedWall layout="carousel" slug={params.slug} />;
}
