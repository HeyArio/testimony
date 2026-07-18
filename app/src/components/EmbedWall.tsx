import { notFound } from "next/navigation";
import Script from "next/script";
import { db } from "@/lib/db";
import { showBadge, testimonialCapReached } from "@/lib/plan";
import { appUrl } from "@/config/brand";
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

  // The widget doubles as a collection entry point: a small CTA links to the
  // public collect page (hidden once the free cap is hit — the page would
  // only tell the visitor it's full).
  const collectUrl = (await testimonialCapReached(project)) ? null : `${appUrl()}/r/${project.slug}`;

  const Wall = layout === "carousel" ? WallCarousel : WallGrid;
  return (
    <main className="p-2" id="gavah-root">
      <Wall
        brandColor={project.brandColor}
        collectUrl={collectUrl}
        showBadge={showBadge(project)}
        testimonials={project.testimonials}
      />
      {/* Report content height to the parent page so embed.js can resize the
          iframe. Measure the content root, NOT documentElement: the document
          can never be shorter than the iframe viewport, so measuring it lets
          the height ratchet up but never shrink back. */}
      <Script id="gavah-resize" strategy="afterInteractive">
        {`(function () {
          var slug = ${JSON.stringify(project.slug)};
          var root = document.getElementById("gavah-root");
          function report() {
            parent.postMessage(
              { type: "gavah:height", slug: slug, height: root.offsetHeight + 4 },
              "*"
            );
          }
          new ResizeObserver(report).observe(root);
          window.addEventListener("load", report);
          report();
        })();`}
      </Script>
    </main>
  );
}
