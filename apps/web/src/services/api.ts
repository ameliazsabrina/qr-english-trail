import type {
  PointSummary,
  PublicLearningPoint,
  QuizAnswerResult,
  QuizQuestion,
} from "@bonjotan/shared-types";

const API_URL = import.meta.env.VITE_API_URL ?? "";

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    signal ? { signal } : undefined,
  );
  if (!response.ok)
    throw new Error(`Request failed with status ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getPoints(signal?: AbortSignal): Promise<PointSummary[]> {
  const result = await getJson<{ points: PointSummary[] }>(
    "/api/points",
    signal,
  );
  return result.points;
}

export async function getPoint(
  slug: string,
  signal?: AbortSignal,
): Promise<PublicLearningPoint> {
  const result = await getJson<{ point: PublicLearningPoint }>(
    `/api/points/${encodeURIComponent(slug)}`,
    signal,
  );
  return result.point;
}

export async function getQuiz(signal?: AbortSignal): Promise<QuizQuestion[]> {
  const result = await getJson<{ questions: QuizQuestion[] }>(
    "/api/quiz",
    signal,
  );
  return result.questions;
}

export async function checkAnswer(
  questionId: string,
  optionId: string,
): Promise<QuizAnswerResult> {
  const response = await fetch(`${API_URL}/api/quiz/check`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ questionId, optionId }),
  });
  if (!response.ok)
    throw new Error(`Request failed with status ${response.status}`);
  const result = (await response.json()) as { result: QuizAnswerResult };
  return result.result;
}
