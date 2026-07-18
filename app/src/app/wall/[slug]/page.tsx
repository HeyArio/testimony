import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { showBadge, testimonialCapReached } from "@/lib/plan";
import { DEMO_SLUG } from "@/lib/demo";
import { fa } from "@/i18n/fa";
import { DemoGuestCard } from "@/components/DemoGuestCard";
import { WallGrid } from "@/components/WallGrid";

// Hosted Wall of Love. Approved testimonials only; cached 5 minutes.
export const revalidate = 300;

export default async function WallPage({ params }: { params: { slug: string } }) {
  const project = await db.project.findUnique({
    where: { slug: params.slug },
    include: {
      testimonials: { where: { status: "approved" }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) notFound();
  const collectUrl = (await testimonialCapReached(project)) ? null : `/r/${project.slug}`;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <header
        className="mb-8 flex flex-col items-center gap-3 rounded-3xl px-6 py-9 text-center"
        style={{
          background: `radial-gradient(ellipse 75% 100% at 50% 0%, ${project.brandColor}14, transparent 75%)`,
        }}
      >
        {project.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="h-14 w-14 rounded-card border border-hairline bg-white object-contain" src={project.logoUrl} />
        )}
        <h1 className="text-2xl font-black leading-fa sm:text-3xl">{fa.wall.title(project.name)}</h1>
        <span className="h-1 w-14 rounded-full" style={{ background: project.brandColor }} />
      </header>
      {project.slug === DEMO_SLUG && <DemoGuestCard brandColor={project.brandColor} />}
      <WallGrid
        brandColor={project.brandColor}
        collectUrl={collectUrl}
        showBadge={showBadge(project)}
        testimonials={project.testimonials}
      />
    </main>
  );
}
