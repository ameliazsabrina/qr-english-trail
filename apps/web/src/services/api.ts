import type { PointSummary, PublicLearningPoint } from "@bonjotan/shared-types";

const API_URL = import.meta.env.VITE_API_URL ?? "";

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, signal ? { signal } : undefined);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getPoints(signal?: AbortSignal): Promise<PointSummary[]> {
  const result = await getJson<{ points: PointSummary[] }>("/api/points", signal);
  return result.points;
}

export async function getPoint(slug: string, signal?: AbortSignal): Promise<PublicLearningPoint> {
  const result = await getJson<{ point: PublicLearningPoint }>(`/api/points/${encodeURIComponent(slug)}`, signal);
  return result.point;
}
