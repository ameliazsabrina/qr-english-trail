import { learningPoints } from "@bonjotan/content";
import type { LearningPoint, PointSummary, PublicLearningPoint, QuizAnswerResult, QuizQuestion } from "@bonjotan/shared-types";

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

export type RandomSource = () => number;

function shuffle<T>(items: T[], random: RandomSource): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex]!, items[index]!];
  }
  return items;
}

export function getPointQuiz(slug: string, random: RandomSource = Math.random): QuizQuestion[] | undefined {
  const point = learningPoints.find(
    (candidate) => candidate.slug === slug && candidate.status === "active",
  );
  if (!point) return undefined;

  const questions = point.questions
    .filter(({ active }) => active)
    .map(({ correctOptionId: _correctOptionId, acceptedAnswers: _acceptedAnswers, options, ...question }) => ({
      ...question,
      topic: point.topic,
      ...(options ? { options: shuffle(options.map((option) => ({ ...option })), random) } : {})
    }));

  return shuffle(questions, random).slice(0, 5);
}

export function getActivePoint(slug: string): LearningPoint | undefined {
  return learningPoints.find((candidate) => candidate.slug === slug && candidate.status === "active");
}

export function selectAttemptQuestions(slug: string, random: RandomSource = Math.random): QuizQuestion[] | undefined {
  return getPointQuiz(slug, random);
}

export function getQuestionResult(pointId: string, contentVersion: string, questionId: string, optionId: string): QuizAnswerResult | undefined {
  const point = learningPoints.find((candidate) => candidate.id === pointId && candidate.contentVersion === contentVersion);
  const question = point?.questions.find((candidate) => candidate.id === questionId && candidate.active);
  if (!question || question.type !== "multiple-choice" || !question.options?.some(({ id }) => id === optionId)) return undefined;
  return {
    correct: question.correctOptionId === optionId,
    ...(question.correctOptionId ? { correctOptionId: question.correctOptionId } : {}),
    ...(question.explanation ? { explanation: question.explanation } : {}),
  };
}
