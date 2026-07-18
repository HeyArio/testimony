import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { projectCapReached } from "@/lib/plan";
import { fa } from "@/i18n/fa";
import { faDigits } from "@/lib/format";
import { ProjectCreateForm } from "@/components/ProjectCreateForm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const projects = await db.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { testimonials: true } } },
  });
  const capReached = await projectCapReached(user);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black">{fa.projects.title}</h1>
      {projects.length === 0 && <p className="text-ink/70">{fa.projects.empty}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <Link className="card card-lift block hover:border-primary" href={`/dashboard/${p.id}`} key={p.id}>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-3">
                <span className="inline-block h-5 w-5 rounded-full border border-hairline" style={{ background: p.brandColor }} />
                <span className="font-black">{p.name}</span>
              </span>
              <span className="rounded-full bg-porcelain px-3 py-0.5 text-xs font-bold">
                {p.plan === "pro" ? fa.projects.planPro : fa.projects.planFree}
              </span>
            </div>
            <p className="mt-3 text-sm text-ink/70">
              {fa.projects.testimonialCount(faDigits(p._count.testimonials))} · /r/{p.slug}
            </p>
          </Link>
        ))}
      </div>
      {capReached ? (
        <p className="card text-sm text-ink/70">{fa.projects.limitReached}</p>
      ) : (
        <ProjectCreateForm />
      )}
    </div>
  );
}
