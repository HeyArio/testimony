import { notFound } from "next/navigation";
import Script from "next/script";
import { db } from "@/lib/db";
import { showBadge } from "@/lib/plan";
import { WallGrid } from "@/components/WallGrid";

// Iframe content loaded by embed.js. Approved testimonials only; cached 5
// minutes. Framing is allowed here (see headers() in next.config.mjs) and
// nowhere else.
export const revalidate = 300;

export default async function EmbedWallPage({ params }: { params: { slug: string } }) {
  const project = await db.project.findUnique({
    where: { slug: params.slug },
    include: {
      testimonials: { where: { status: "approved" }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) notFound();

  return (
    <main className="p-2">
      <WallGrid brandColor={project.brandColor} showBadge={showBadge(project)} testimonials={project.testimonials} />
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
