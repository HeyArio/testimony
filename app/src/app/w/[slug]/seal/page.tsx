import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { computeAvazeh } from "@/lib/avazeh";
import { AvazehSeal } from "@/components/AvazehSeal";
import { fa } from "@/i18n/fa";
import { appUrl } from "@/config/brand";

// The embeddable آوازه seal (iframe content for data-gavah-seal divs).
// Transparent background from w/layout; fixed-size content, no resize
// protocol needed. Cached like the walls, revalidated on moderation.
export const revalidate = 300;

export default async function SealPage({ params }: { params: { slug: string } }) {
  const project = await db.project.findUnique({
    where: { slug: params.slug },
    include: { testimonials: { where: { status: "approved" } } },
  });
  if (!project) notFound();

  const avazeh = computeAvazeh(project.testimonials);
  return (
    <main className="flex items-center justify-center p-1">
      <a
        className="transition-transform duration-200 hover:-translate-y-0.5"
        href={`${appUrl()}/wall/${project.slug}`}
        rel="noopener noreferrer"
        style={{ display: "inline-block" }}
        target="_blank"
      >
        {avazeh ? (
          <AvazehSeal avazeh={avazeh} brandColor={project.brandColor} compact />
        ) : (
          <span className="inline-block rounded-full border border-hairline bg-white px-4 py-1.5 text-[11px] text-ink/50">
            {fa.avazeh.notEnough}
          </span>
        )}
      </a>
    </main>
  );
}
