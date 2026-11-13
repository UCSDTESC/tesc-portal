import { useEffect, useState } from "react";
import { EventQuestion } from "@lib/constants";
import {
  type EventQuestionAnswers,
  hasUnansweredRequired,
  questionKey,
} from "@lib/eventQuestions";

export function RegistrationQuestionFields({
  questions,
  answers,
  onChange,
}: {
  questions: EventQuestion[];
  answers: EventQuestionAnswers;
  onChange: (answers: EventQuestionAnswers) => void;
}) {
  const setValue = (question: EventQuestion, value: string) => {
    onChange({ ...answers, [questionKey(question)]: value });
  };

  return (
    <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto">
      {questions.map((question) => {
        const key = questionKey(question);
        const value = answers[key] ?? "";
        return (
          <label key={key} className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-navy-900">
              {question.prompt}
              {question.required ? <span className="text-red-500"> *</span> : null}
            </span>
            {question.type === "text" && (
              <input
                className="rounded-xl border border-line bg-white px-3 py-2 text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                value={value}
                onChange={(e) => setValue(question, e.target.value)}
              />
            )}
            {question.type === "yes_no" && (
              <div className="flex gap-4">
                {["Yes", "No"].map((option) => (
                  <label key={option} className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name={key}
                      className="h-4 w-4 accent-brand-600"
                      checked={value === option}
                      onChange={() => setValue(question, option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
            {question.type === "choice" && (
              <div className="flex flex-col gap-1">
                {(question.options ?? []).filter(Boolean).map((option) => (
                  <label key={option} className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name={key}
                      className="h-4 w-4 accent-brand-600"
                      checked={value === option}
                      onChange={() => setValue(question, option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
          </label>
        );
      })}
    </div>
  );
}

export default function RegistrationQuestionsModal({
  open,
  questions,
  initialAnswers = {},
  submitLabel = "Continue",
  onSubmit,
  onClose,
}: {
  open: boolean;
  questions: EventQuestion[];
  initialAnswers?: EventQuestionAnswers;
  submitLabel?: string;
  onSubmit: (answers: EventQuestionAnswers) => Promise<void>;
  onClose: () => void;
}) {
  const [answers, setAnswers] = useState<EventQuestionAnswers>(initialAnswers);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAnswers(initialAnswers);
      setError("");
      setSubmitting(false);
    }
  }, [open, initialAnswers]);

  if (!open) return null;

  const submitDisabled = submitting || hasUnansweredRequired(questions, answers);

  const handleSubmit = async () => {
    if (submitDisabled) return;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(answers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save answers");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="card-shadow relative z-10 w-full max-w-lg rounded-2xl border border-line bg-white p-6">
        <h2 className="font-DM text-xl font-bold tracking-tight text-navy-900">Registration questions</h2>
        <p className="mt-1 text-sm text-ink-secondary">Please answer these questions to continue.</p>
        <div className="mt-4">
          <RegistrationQuestionFields questions={questions} answers={answers} onChange={setAnswers} />
        </div>
        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitDisabled}
            onClick={handleSubmit}
            className="rounded-xl bg-navy-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Please wait…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
