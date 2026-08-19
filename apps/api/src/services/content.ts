import { learningPoints } from "@bonjotan/content";
import type { PointSummary, PublicLearningPoint, QuizAnswerResult, QuizQuestion } from "@bonjotan/shared-types";

export function listActivePoints(): PointSummary[] {
  return learningPoints
    .filter(({ status }) => status === "active")
    .sort((a, b) => a.pointNumber - b.pointNumber)
    .map(({ id, slug, pointNumber, title, topic }) => ({ id, slug, pointNumber, title, topic }));
}

export function getPublicPoint(slug: string): PublicLearningPoint | undefined {
  const point = learningPoints.find((candidate) => candidate.slug === slug && candidate.status === "active");
  if (!point) return undefined;
  const { questions, ...safePoint } = point;
  return { ...safePoint, questionCount: questions.filter(({ active }) => active).length };
}

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex]!, items[index]!];
  }
  return items;
}

export function getQuizQuestions(): QuizQuestion[] {
  const questions = learningPoints
    .filter(({ status }) => status === "active")
    .flatMap(({ topic, questions: pointQuestions }) => pointQuestions
      .filter(({ active }) => active)
      .map(({ correctOptionId: _correctOptionId, acceptedAnswers: _acceptedAnswers, options, ...question }) => ({
        ...question,
        topic,
        ...(options ? { options: shuffle(options.map((option) => ({ ...option }))) } : {})
      })));

  return shuffle(questions);
}

export function checkQuizAnswer(questionId: string, optionId: string): QuizAnswerResult | undefined {
  const question = learningPoints
    .filter(({ status }) => status === "active")
    .flatMap(({ questions }) => questions)
    .find(({ id, active }) => id === questionId && active);

  if (!question || question.type !== "multiple-choice") return undefined;
  return {
    correct: question.correctOptionId === optionId,
    ...(question.correctOptionId ? { correctOptionId: question.correctOptionId } : {}),
    ...(question.explanation ? { explanation: question.explanation } : {})
  };
}
