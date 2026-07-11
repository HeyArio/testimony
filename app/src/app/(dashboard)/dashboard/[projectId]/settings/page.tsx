import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fa } from "@/i18n/fa";
import { customQuestions } from "@/lib/questions";
import { BrandSettingsForm } from "@/components/BrandSettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ params }: { params: { projectId: string } }) {
  const user = await requireUser();
  const project = await db.project.findUnique({ where: { id: params.projectId } });
  if (!project || project.userId !== user.id) notFound();

  return (
    <div className="flex max-w-md flex-col gap-6">
      <h1 className="text-2xl font-black">{fa.settings.title}</h1>
      <BrandSettingsForm
        project={{
          id: project.id,
          name: project.name,
          brandColor: project.brandColor,
          logoUrl: project.logoUrl,
          questions: customQuestions(project.questionsJson),
        }}
      />
    </div>
  );
}
