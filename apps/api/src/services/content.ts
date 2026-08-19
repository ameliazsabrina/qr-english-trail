import { learningPoints } from "@bonjotan/content";
import type { PointSummary, PublicLearningPoint } from "@bonjotan/shared-types";

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

