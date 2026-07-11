import { fa } from "@/i18n/fa";

/** The project's own custom questions; empty when none are set. */
export function customQuestions(questionsJson: string | null): string[] {
  if (!questionsJson) return [];
  try {
    const parsed = JSON.parse(questionsJson);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((q): q is string => typeof q === "string" && q.trim().length > 0).slice(0, 5);
  } catch {
    return []; // corrupt JSON → treat as unset
  }
}

/** Guiding questions for the collection page: custom if set, else defaults. */
export function projectQuestions(questionsJson: string | null): readonly string[] {
  const custom = customQuestions(questionsJson);
  return custom.length > 0 ? custom : fa.collect.questions;
}
