import { notFound } from "next/navigation";
import Script from "next/script";
import { db } from "@/lib/db";
import { showBadge } from "@/lib/plan";
import { WallCarousel, WallGrid } from "@/components/WallGrid";

// Shared body of the /w/[slug] embed routes (one per layout). Framing is
// allowed on /w/* only (see headers() in next.config.mjs).

export async function EmbedWall({ slug, layout }: { slug: string; layout: "wall" | "carousel" }) {
  const project = await db.project.findUnique({
    where: { slug },
    include: {
      testimonials: { where: { status: "approved" }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) notFound();

  const Wall = layout === "carousel" ? WallCarousel : WallGrid;
  return (
    <main className="p-2">
      <Wall brandColor={project.brandColor} showBadge={showBadge(project)} testimonials={project.testimonials} />
      {/* Report content height to the parent page so embed.js can resize the iframe. */}
      <Script id="gavah-resize" strategy="afterInteractive">
        {`(function () {
          var slug = ${JSON.stringify(project.slug)};
          function report() {
            parent.postMessage(
              { type: "gavah:height", slug: slug, height: document.documentElement.scrollHeight },
              "*"
            );
          }
          new ResizeObserver(report).observe(document.documentElement);
          window.addEventListener("load", report);
          report();
        })();`}
      </Script>
    </main>
  );
}
