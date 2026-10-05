import supabase from "@server/supabase";
import { EventQuestion } from "@lib/constants";
import { type EventQuestionAnswers, questionKey } from "@lib/eventQuestions";

async function findEventsLogId(eventId: string, userId: string) {
  const { data, error } = await supabase
    .from("events_log")
    .select("id")
    .eq("event_id", Number(eventId))
    .eq("user_id", userId)
    .order("updated", { ascending: false })
    .limit(1);
  if (error) return { id: null as number | null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { id: row?.id != null ? Number(row.id) : null, error: null };
}

export async function fetchMyEventQuestionAnswers(eventId: string, userId: string) {
  const { id, error } = await findEventsLogId(eventId, userId);
  if (error || id == null) return { answers: {} as EventQuestionAnswers, error };
  const { data, error: answersError } = await supabase
    .from("event_question_answers")
    .select("question_id, value")
    .eq("events_log_id", id);
  if (answersError) return { answers: {} as EventQuestionAnswers, error: answersError };
  const answers: EventQuestionAnswers = {};
  for (const row of data ?? []) {
    answers[String(row.question_id)] = String(row.value ?? "");
  }
  return { answers, error: null };
}

export async function saveEventQuestionAnswers(
  eventId: string,
  userId: string,
  questions: EventQuestion[],
  answers: EventQuestionAnswers,
) {
  const { id, error } = await findEventsLogId(eventId, userId);
  if (error) return error;
  if (id == null) return { message: "Registration record not found" };

  const rows = questions
    .filter((question) => question.id && answers[questionKey(question)]?.trim())
    .map((question) => ({
      events_log_id: id,
      question_id: Number(question.id),
      value: answers[questionKey(question)].trim(),
    }));
  if (!rows.length) return null;

  const { error: upsertError } = await supabase
    .from("event_question_answers")
    .upsert(rows, { onConflict: "events_log_id,question_id" });
  return upsertError;
}

export async function markQuestionAnswerCounts(questions: EventQuestion[]) {
  const ids = questions.map((question) => Number(question.id)).filter((id) => Number.isFinite(id));
  if (!ids.length) return questions;
  const { data } = await supabase
    .from("event_question_answers")
    .select("question_id")
    .in("question_id", ids);
  const answered = new Set((data ?? []).map((row) => String(row.question_id)));
  return questions.map((question) => ({
    ...question,
    has_answers: question.id ? answered.has(question.id) : false,
  }));
}

export type EventRegistrantRow = {
  events_log_id: number;
  user_id: string;
  attended: boolean;
  users: { email: string; first_name: string; last_name: string; major: string } | null;
  answers: EventQuestionAnswers;
};

export async function fetchEventRegistrantsWithAnswers(eventId: string) {
  const { data, error } = await supabase
    .from("events_log")
    .select(
      "id, user_id, attended, users (email, first_name, last_name, major), event_question_answers (question_id, value)",
    )
    .eq("event_id", Number(eventId));
  if (error) return { rows: [] as EventRegistrantRow[], error };

  const rows: EventRegistrantRow[] = (data ?? []).map((row) => {
    const record = row as {
      id: number;
      user_id: string | null;
      attended: boolean;
      users:
        | EventRegistrantRow["users"]
        | EventRegistrantRow["users"][]
        | null;
      event_question_answers: { question_id: number; value: string }[] | null;
    };
    const answers: EventQuestionAnswers = {};
    for (const answer of record.event_question_answers ?? []) {
      answers[String(answer.question_id)] = String(answer.value ?? "");
    }
    const users = Array.isArray(record.users) ? (record.users[0] ?? null) : record.users;
    return {
      events_log_id: Number(record.id),
      user_id: String(record.user_id ?? ""),
      attended: Boolean(record.attended),
      users,
      answers,
    };
  });
  return { rows, error: null };
}

export function buildRegistrantCsv(
  questions: EventQuestion[],
  rows: EventRegistrantRow[],
) {
  return rows.map((row) => {
    const record: Record<string, string> = {
      email: row.users?.email ?? "",
      first_name: row.users?.first_name ?? "",
      last_name: row.users?.last_name ?? "",
      major: row.users?.major ?? "",
      status: row.attended ? "attended" : "rsvp",
    };
    for (const question of questions) {
      const header = question.prompt.trim() || questionKey(question);
      record[header] = question.id ? (row.answers[question.id] ?? "") : "";
    }
    return record;
  });
}
