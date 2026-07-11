import { EmbedWall } from "@/components/EmbedWall";

// Iframe content loaded by embed.js (default masonry layout). Approved
// testimonials only; cached 5 minutes.
export const revalidate = 300;

export default function EmbedWallPage({ params }: { params: { slug: string } }) {
  return <EmbedWall layout="wall" slug={params.slug} />;
}
