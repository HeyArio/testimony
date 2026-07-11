import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { testimonialCapReached } from "@/lib/plan";
import { fa } from "@/i18n/fa";
import { projectQuestions } from "@/lib/questions";
import { CollectClient } from "@/components/collect/CollectClient";

export const dynamic = "force-dynamic";

// Public collection page — the customer records here. No auth, mobile-first.
export default async function CollectPage({ params }: { params: { slug: string } }) {
  const project = await db.project.findUnique({ where: { slug: params.slug } });
  if (!project) notFound();
  const full = await testimonialCapReached(project);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-5 py-8">
      <header className="flex items-center gap-3">
        {project.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="h-10 w-10 rounded-card border border-hairline object-contain" src={project.logoUrl} />
        )}
        <span
          className="rounded-full px-4 py-1 text-sm font-black text-white"
          style={{ background: project.brandColor }}
        >
          {project.name}
        </span>
      </header>
      <h1 className="text-2xl font-black leading-fa">{fa.collect.title(project.name)}</h1>
      {full ? (
        <p className="card text-ink/80">{fa.collect.full}</p>
      ) : (
        <>
          <p className="text-ink/80">{fa.collect.intro}</p>
          <div className="card">
            <p className="mb-2 font-bold">{fa.collect.questionsTitle}</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-ink/80">
              {projectQuestions(project.questionsJson).map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
          <CollectClient slug={project.slug} />
        </>
      )}
    </main>
  );
}
