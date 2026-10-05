import { EventQuestion, EventQuestionType } from "@lib/constants";
import { EVENT_QUESTION_MAX, blankEventQuestion } from "@lib/eventQuestions";

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
        <label className="font-medium">Registration questions</label>
        <button
          type="button"
          className="text-sm text-navy underline cursor-pointer disabled:opacity-50"
          onClick={addQuestion}
          disabled={questions.length >= EVENT_QUESTION_MAX}
        >
          + Add question
        </button>
      </div>
      <p className="text-xs text-gray-600">
        Asked when someone RSVPs. If they skip RSVP, unanswered required questions are asked at
        check-in. Maximum {EVENT_QUESTION_MAX}.
      </p>
      {questions.map((question, index) => (
        <div key={question.id ?? `new-${index}`} className="rounded-lg border border-gray-200 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="border-black border rounded-lg px-3 h-10 flex-1 min-w-[12rem]"
              placeholder={`Question ${index + 1}`}
              value={question.prompt}
              onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
            />
            <select
              className="border-black border rounded-lg px-2 h-10"
              value={question.type}
              onChange={(e) =>
                updateQuestion(index, { type: e.target.value as EventQuestionType })
              }
            >
              <option value="text">Short text</option>
              <option value="choice">Multiple choice</option>
              <option value="yes_no">Yes / No</option>
            </select>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => updateQuestion(index, { required: e.target.checked })}
              />
              Required
            </label>
            <button
              type="button"
              className="text-sm text-red-600 underline disabled:opacity-40"
              onClick={() => removeQuestion(index)}
              disabled={Boolean(question.has_answers)}
              title={
                question.has_answers
                  ? "This question already has answers and cannot be removed"
                  : "Remove question"
              }
            >
              Remove
            </button>
          </div>
          {question.type === "choice" && (
            <div className="mt-2 flex flex-col gap-1">
              {(question.options ?? ["", ""]).map((option, optionIndex) => (
                <input
                  key={optionIndex}
                  className="border-black border rounded-lg px-3 h-9"
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
                className="self-start text-sm text-navy underline"
                onClick={() =>
                  updateQuestion(index, { options: [...(question.options ?? []), ""] })
                }
              >
                + Add option
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
