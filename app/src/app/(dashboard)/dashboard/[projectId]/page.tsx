import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { FREE_TESTIMONIAL_CAP } from "@/lib/plan";
import { publicUrl } from "@/lib/r2";
import { appUrl } from "@/config/brand";
import { fa } from "@/i18n/fa";
import { faDigits } from "@/lib/format";
import { CopySnippet } from "@/components/CopySnippet";
import { TestimonialCard } from "@/components/TestimonialCard";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
  const user = await requireUser();
  const project = await db.project.findUnique({
    where: { id: params.projectId },
    include: { testimonials: { orderBy: { createdAt: "desc" } } },
  });
  if (!project || project.userId !== user.id) notFound();

  // Pending first, then newest.
  const testimonials = [...project.testimonials].sort(
    (a, b) => Number(b.status === "pending") - Number(a.status === "pending"),
  );
  const base = appUrl();
  const collectUrl = `${base}/r/${project.slug}`;
  const wallUrl = `${base}/wall/${project.slug}`;
  const embedCode = `<script src="${base}/embed.js" async></script>\n<div data-gavah-wall="${project.slug}"></div>`;
  const count = project.testimonials.length;
  const isFree = project.plan !== "pro";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">{project.name}</h1>
        <Link className="btn-ghost" href={`/dashboard/${project.id}/settings`}>
          {fa.settings.title}
        </Link>
      </div>

      <div className="card flex flex-col gap-4">
        <div>
          <p className="label">{fa.inbox.collectLink}</p>
          <CopySnippet text={collectUrl} />
        </div>
        <div>
          <p className="label">{fa.inbox.wallLink}</p>
          <CopySnippet text={wallUrl} />
        </div>
        <div>
          <p className="label">{fa.inbox.embedTitle}</p>
          <CopySnippet multiline text={embedCode} />
        </div>
      </div>

      {isFree && (
        <p className="card border-accent text-sm">
          {count >= FREE_TESTIMONIAL_CAP ? fa.inbox.freeCapFull : fa.inbox.freeCapNote(faDigits(count))}
        </p>
      )}

      <h2 className="text-xl font-black">{fa.inbox.title}</h2>
      {testimonials.length === 0 && <p className="text-ink/70">{fa.inbox.empty}</p>}
      <div className="flex flex-col gap-4">
        {testimonials.map((t) => (
          <TestimonialCard
            clipUrl={t.clipKey ? publicUrl(t.clipKey) : null}
            key={t.id}
            testimonial={{
              id: t.id,
              type: t.type,
              status: t.status,
              authorName: t.authorName,
              authorRole: t.authorRole,
              rating: t.rating,
              text: t.text,
              hasTranscript: !!t.transcriptJson,
              createdAt: t.createdAt.toISOString(),
            }}
            videoUrl={t.videoKey ? publicUrl(t.videoKey) : null}
          />
        ))}
      </div>
    </div>
  );
}
