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
            <span className="font-medium text-navy">
              {question.prompt}
              {question.required ? <span className="text-red-500"> *</span> : null}
            </span>
            {question.type === "text" && (
              <input
                className="rounded-lg border border-gray-300 px-3 py-2"
                value={value}
                onChange={(e) => setValue(question, e.target.value)}
              />
            )}
            {question.type === "yes_no" && (
              <div className="flex gap-4">
                {["Yes", "No"].map((option) => (
                  <label key={option} className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={key}
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
                  <label key={option} className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={key}
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
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <h2 className="font-DM text-xl font-bold text-navy">Registration questions</h2>
        <p className="mt-1 text-sm text-gray-600">Please answer these questions to continue.</p>
        <div className="mt-4">
          <RegistrationQuestionFields questions={questions} answers={answers} onChange={setAnswers} />
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitDisabled}
            onClick={handleSubmit}
            className="rounded-lg bg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Please wait…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
