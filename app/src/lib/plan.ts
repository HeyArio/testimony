import type { Project, User } from "@prisma/client";
import { db } from "@/lib/db";

// Product rules from CLAUDE.md. Plan lives on Project; billing (M4) is behind
// a feature flag and until then `plan` is flipped manually in the DB.

export const FREE_TESTIMONIAL_CAP = 5;
export const FREE_PROJECT_CAP = 1;
export const PRO_PROJECT_CAP = 3;

export function billingEnabled(): boolean {
  return process.env.BILLING_ENABLED === "1";
}

export function showBadge(project: Pick<Project, "plan">): boolean {
  return project.plan !== "pro";
}

/** Free projects accept at most 5 testimonials; enforced at creation time. */
export async function testimonialCapReached(project: Pick<Project, "id" | "plan">): Promise<boolean> {
  if (project.plan === "pro") return false;
  const count = await db.testimonial.count({ where: { projectId: project.id } });
  return count >= FREE_TESTIMONIAL_CAP;
}

/** Free: 1 project. Pro (any pro project on the account): 3. */
export async function projectCapReached(user: Pick<User, "id">): Promise<boolean> {
  const projects = await db.project.findMany({
    where: { userId: user.id },
    select: { plan: true },
  });
  const cap = projects.some((p) => p.plan === "pro") ? PRO_PROJECT_CAP : FREE_PROJECT_CAP;
  return projects.length >= cap;
}
