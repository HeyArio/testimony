import { revalidatePath } from "next/cache";

/** The walls cache for 5 minutes; dashboard changes must show up immediately. */
export function revalidateWalls(slug: string) {
  revalidatePath(`/wall/${slug}`);
  revalidatePath(`/w/${slug}`);
  revalidatePath(`/w/${slug}/carousel`);
}
