import type { LearningPoint } from "@bonjotan/shared-types";
import { learningPointSchema } from "./schema.js";

export function validateContent(points: LearningPoint[]): void {
  if (points.length !== 10) throw new Error(`Expected exactly 10 points, received ${points.length}`);

  const pointIds = new Set<string>();
  const slugs = new Set<string>();
  const numbers = new Set<number>();
  const questionIds = new Set<string>();

  for (const point of points) {
    learningPointSchema.parse(point);
    if (pointIds.has(point.id)) throw new Error(`Duplicate point ID: ${point.id}`);
    if (slugs.has(point.slug)) throw new Error(`Duplicate point slug: ${point.slug}`);
    if (numbers.has(point.pointNumber)) throw new Error(`Duplicate point number: ${point.pointNumber}`);
    pointIds.add(point.id);
    slugs.add(point.slug);
    numbers.add(point.pointNumber);

    const activeQuestions = point.questions.filter(({ active }) => active);
    if (point.status === "active" && activeQuestions.length < 2) {
      throw new Error(`Active point ${point.id} needs at least two active questions`);
    }
    for (const question of point.questions) {
      if (questionIds.has(question.id)) throw new Error(`Duplicate question ID: ${question.id}`);
      questionIds.add(question.id);
    }
  }
}

