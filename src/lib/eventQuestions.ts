import type { EventQuestion, EventQuestionType } from "@lib/constants";

export const EVENT_QUESTION_MAX = 8;

export type EventQuestionAnswers = Record<string, string>;

export function questionKey(question: EventQuestion): string {
  return question.id ?? `new-${question.sort_order}`;
}

export function normalizeEventQuestions(rows: unknown): EventQuestion[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row, index) => {
      const record = row as Record<string, unknown>;
      const type: EventQuestionType =
        record.type === "choice" || record.type === "yes_no" ? record.type : "text";
      return {
        id: record.id != null ? String(record.id) : undefined,
        sort_order: Number(record.sort_order ?? index),
        prompt: String(record.prompt ?? ""),
        type,
        options: Array.isArray(record.options) ? record.options.map(String) : null,
        required: record.required !== false,
      } satisfies EventQuestion;
    })
    .filter((question) => question.prompt.trim())
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function unansweredRequiredQuestions(
  questions: EventQuestion[] | undefined,
  answers: EventQuestionAnswers,
): EventQuestion[] {
  return (questions ?? []).filter((question) => {
    if (!question.required) return false;
    return !answers[questionKey(question)]?.trim();
  });
}

export function hasUnansweredRequired(
  questions: EventQuestion[] | undefined,
  answers: EventQuestionAnswers,
): boolean {
  return unansweredRequiredQuestions(questions, answers).length > 0;
}

export function validateEventQuestions(questions: EventQuestion[] | undefined): string | null {
  const valid = (questions ?? []).filter((question) => question.prompt.trim());
  if (valid.length > EVENT_QUESTION_MAX) {
    return `Maximum of ${EVENT_QUESTION_MAX} registration questions per event`;
  }
  for (const question of valid) {
    if (question.type !== "choice") continue;
    const options = (question.options ?? []).map((option) => option.trim()).filter(Boolean);
    if (options.length < 2) {
      return `Choice question "${question.prompt.trim()}" needs at least two options`;
    }
  }
  return null;
}

export function blankEventQuestion(sortOrder: number): EventQuestion {
  return {
    sort_order: sortOrder,
    prompt: "",
    type: "text",
    options: ["", ""],
    required: true,
  };
}
