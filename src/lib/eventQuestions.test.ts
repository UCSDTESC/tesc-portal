import { describe, expect, it } from "vitest";
import {
  hasUnansweredRequired,
  normalizeEventQuestions,
  unansweredRequiredQuestions,
  validateEventQuestions,
} from "./eventQuestions";

describe("normalizeEventQuestions", () => {
  it("sorts and stringifies ids", () => {
    const questions = normalizeEventQuestions([
      { id: 2, sort_order: 1, prompt: "Size", type: "choice", options: ["S", "M"], required: true },
      { id: 1, sort_order: 0, prompt: "Diet", type: "text", required: false },
    ]);
    expect(questions.map((question) => question.id)).toEqual(["1", "2"]);
    expect(questions[0].required).toBe(false);
  });
});

describe("unansweredRequiredQuestions", () => {
  const questions = normalizeEventQuestions([
    { id: "a", sort_order: 0, prompt: "Diet", type: "text", required: true },
    { id: "b", sort_order: 1, prompt: "Shirt", type: "choice", options: ["S", "M"], required: false },
  ]);

  it("requires trimmed answers for required questions only", () => {
    expect(unansweredRequiredQuestions(questions, { a: "  " }).map((q) => q.id)).toEqual(["a"]);
    expect(hasUnansweredRequired(questions, { a: "Vegetarian" })).toBe(false);
  });
});

describe("validateEventQuestions", () => {
  it("rejects choice questions with fewer than two options", () => {
    expect(
      validateEventQuestions([
        { sort_order: 0, prompt: "Size", type: "choice", options: ["S"], required: true },
      ]),
    ).toMatch(/at least two options/i);
  });
});
