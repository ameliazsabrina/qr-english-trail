import { describe, expect, it } from "vitest";
import { learningPoints } from "@bonjotan/content";
import { getPointQuiz } from "./content.js";

describe("point quiz sampling", () => {
  it("only shuffles questions and options within the requested point", () => {
    const questions = getPointQuiz("greetings", () => 0)!;
    expect(questions.map(({ id }) => id)).toEqual([
      "p01-q2", "p01-q3", "p01-q4", "p01-q5", "p01-q1",
    ]);
    expect(questions.every(({ topic }) => topic === "Greetings")).toBe(true);
    expect(questions[0]?.options?.map(({ id }) => id)).toEqual(["b", "c", "a"]);
  });

  it("returns exactly five matching questions only for an active point slug", () => {
    for (const point of learningPoints) {
      const questions = getPointQuiz(point.slug, () => 0)!;
      const pointQuestionIds = new Set(point.questions.map(({ id }) => id));

      expect(questions).toHaveLength(5);
      expect(questions.every(({ id }) => pointQuestionIds.has(id))).toBe(true);
      expect(questions.every(({ topic }) => topic === point.topic)).toBe(true);
    }
    expect(getPointQuiz("not-a-point", () => 0)).toBeUndefined();

    const point = learningPoints.find(({ slug }) => slug === "greetings")!;
    const originalStatus = point.status;
    try {
      point.status = "inactive";
      expect(getPointQuiz("greetings", () => 0)).toBeUndefined();
    } finally {
      point.status = originalStatus;
    }
  });
});
