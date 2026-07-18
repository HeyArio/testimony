import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { FREE_TESTIMONIAL_CAP } from "@/lib/plan";
import { publicUrl } from "@/lib/r2";
import { appUrl } from "@/config/brand";
import { fa } from "@/i18n/fa";
import { faDigits } from "@/lib/format";
import { computeAvazeh, AVAZEH_MIN_RATED } from "@/lib/avazeh";
import { AvazehSeal } from "@/components/AvazehSeal";
import { CopySnippet } from "@/components/CopySnippet";
import { ManualAddForm } from "@/components/ManualAddForm";
import { TestimonialCard } from "@/components/TestimonialCard";
import { WidgetPreview } from "@/components/WidgetPreview";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
  const user = await requireUser();
  const project = await db.project.findUnique({
    where: { id: params.projectId },
    include: {
      testimonials: {
        orderBy: { createdAt: "desc" },
        include: { jobs: { orderBy: { createdAt: "desc" } } },
      },
    },
  });
  if (!project || project.userId !== user.id) notFound();

  // A processing step counts as failed when its most recent job failed.
  const latestFailed = (jobs: { kind: string; status: string }[], kind: string) =>
    jobs.find((j) => j.kind === kind)?.status === "failed";

  // Pending first, then newest.
  const testimonials = [...project.testimonials].sort(
    (a, b) => Number(b.status === "pending") - Number(a.status === "pending"),
  );
  const base = appUrl();
  const collectUrl = `${base}/r/${project.slug}`;
  const wallUrl = `${base}/wall/${project.slug}`;
  const embedCode = `<script src="${base}/embed.js" async></script>\n<div data-gavah-wall="${project.slug}"></div>`;
  const embedCarouselCode = `<script src="${base}/embed.js" async></script>\n<div data-gavah-wall="${project.slug}" data-gavah-layout="carousel"></div>`;
  const count = project.testimonials.length;
  const isFree = project.plan !== "pro";
  const avazeh = computeAvazeh(project.testimonials.filter((t) => t.status === "approved"));
  const sealEmbedCode = `<script src="${base}/embed.js" async></script>\n<div data-gavah-seal="${project.slug}"></div>`;

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
        <div>
          <p className="label">{fa.inbox.embedCarouselTitle}</p>
          <CopySnippet multiline text={embedCarouselCode} />
        </div>
        <p className="text-xs leading-fa text-ink/60">{fa.inbox.embedCtaNote}</p>
      </div>

      {/* آوازه — the proof-weighted trust score + its embeddable seal */}
      <div className="card flex flex-col gap-3">
        <div>
          <p className="font-black">{fa.avazeh.dashTitle}</p>
          <p className="mt-1 text-xs leading-fa text-ink/60">{fa.avazeh.dashHint}</p>
        </div>
        {avazeh ? (
          <>
            <div>
              <AvazehSeal avazeh={avazeh} brandColor={project.brandColor} />
            </div>
            <div>
              <p className="label">{fa.avazeh.dashEmbedTitle}</p>
              <CopySnippet multiline text={sealEmbedCode} />
            </div>
          </>
        ) : (
          <p className="text-sm text-ink/60">{fa.avazeh.dashNotEnough(faDigits(AVAZEH_MIN_RATED))}</p>
        )}
      </div>

      <WidgetPreview slug={project.slug} />

      {isFree && (
        <p className="card border-accent text-sm">
          {count >= FREE_TESTIMONIAL_CAP ? fa.inbox.freeCapFull : fa.inbox.freeCapNote(faDigits(count))}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black">{fa.inbox.title}</h2>
      </div>
      <ManualAddForm projectId={project.id} />
      {testimonials.length === 0 && <p className="text-ink/70">{fa.inbox.empty}</p>}
      <div className="flex flex-col gap-4">
        {testimonials.map((t) => (
          <TestimonialCard
            clipFailed={latestFailed(t.jobs, "render_clip")}
            clipUrl={t.clipKey ? publicUrl(t.clipKey) : null}
            key={t.id}
            transcribeFailed={latestFailed(t.jobs, "transcribe")}
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
