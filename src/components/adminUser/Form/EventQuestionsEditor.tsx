import { EventQuestion, EventQuestionType } from "@lib/constants";
import { EVENT_QUESTION_MAX, blankEventQuestion } from "@lib/eventQuestions";
import { Plus, Trash2 } from "lucide-react";

const inputClass =
  "h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

export default function EventQuestionsEditor({
  questions,
  onChange,
}: {
  questions: EventQuestion[];
  onChange: (questions: EventQuestion[]) => void;
}) {
  const updateQuestion = (index: number, patch: Partial<EventQuestion>) => {
    onChange(questions.map((question, i) => (i === index ? { ...question, ...patch } : question)));
  };

  const removeQuestion = (index: number) => {
    const question = questions[index];
    if (question?.has_answers) return;
    onChange(questions.filter((_, i) => i !== index).map((row, i) => ({ ...row, sort_order: i })));
  };

  const addQuestion = () => {
    if (questions.length >= EVENT_QUESTION_MAX) return;
    onChange([...questions, blankEventQuestion(questions.length)]);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-semibold text-ink">Registration questions</label>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-navy-900 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={addQuestion}
          disabled={questions.length >= EVENT_QUESTION_MAX}
        >
          <Plus className="h-4 w-4" />
          Add question
        </button>
      </div>
      <p className="text-xs leading-relaxed text-ink-secondary">
        Asked when someone RSVPs. If they skip RSVP, unanswered required questions are asked at
        check-in. Maximum {EVENT_QUESTION_MAX}.
      </p>
      {questions.map((question, index) => (
        <div
          key={question.id ?? `new-${index}`}
          className="rounded-xl border border-line bg-surface p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <input
              className={`${inputClass} min-w-[12rem] flex-1`}
              placeholder={`Question ${index + 1}`}
              value={question.prompt}
              onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
            />
            <select
              className="h-10 rounded-xl border border-line bg-white px-2 text-sm text-ink focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              value={question.type}
              onChange={(e) =>
                updateQuestion(index, { type: e.target.value as EventQuestionType })
              }
            >
              <option value="text">Short text</option>
              <option value="choice">Multiple choice</option>
              <option value="yes_no">Yes / No</option>
            </select>
            <label className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-ink-secondary">
              <input
                type="checkbox"
                className="h-4 w-4 accent-navy-900"
                checked={question.required}
                onChange={(e) => updateQuestion(index, { required: e.target.checked })}
              />
              Required
            </label>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => removeQuestion(index)}
              disabled={Boolean(question.has_answers)}
              title={
                question.has_answers
                  ? "This question already has answers and cannot be removed"
                  : "Remove question"
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
          {question.type === "choice" && (
            <div className="mt-3 flex flex-col gap-2">
              {(question.options ?? ["", ""]).map((option, optionIndex) => (
                <input
                  key={optionIndex}
                  className={`${inputClass} h-9`}
                  placeholder={`Option ${optionIndex + 1}`}
                  value={option}
                  onChange={(e) => {
                    const next = [...(question.options ?? [])];
                    next[optionIndex] = e.target.value;
                    updateQuestion(index, { options: next });
                  }}
                />
              ))}
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-1 self-start rounded-lg px-2 py-1 text-sm font-medium text-navy-900 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                onClick={() =>
                  updateQuestion(index, { options: [...(question.options ?? []), ""] })
                }
              >
                <Plus className="h-4 w-4" />
                Add option
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
