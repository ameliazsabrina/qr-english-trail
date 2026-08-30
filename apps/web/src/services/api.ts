import type {
  AttemptAnswerResponse, LeaderboardResponse, PlayerProfile, PlayerProgress,
  PlayerSession, PointSummary, PublicLearningPoint, QuizAttempt,
} from "@bonjotan/shared-types";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const withSignal = (signal?: AbortSignal): RequestInit => signal ? { signal } : {};

export class ApiRequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function requestJson<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const value = await response.json().catch(() => undefined) as { error?: { message?: string } } | undefined;
    throw new ApiRequestError(response.status, value?.error?.message ?? `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getPoints(signal?: AbortSignal): Promise<PointSummary[]> {
  return (await requestJson<{ points: PointSummary[] }>("/api/points", withSignal(signal))).points;
}

export async function getPoint(slug: string, signal?: AbortSignal): Promise<PublicLearningPoint> {
  return (await requestJson<{ point: PublicLearningPoint }>(`/api/points/${encodeURIComponent(slug)}`, withSignal(signal))).point;
}

export function createPlayer(nickname: string, avatarId: string): Promise<PlayerSession> {
  return requestJson("/api/players", { method: "POST", body: JSON.stringify({ nickname, avatarId }) });
}

export function recoverPlayer(recoveryCode: string): Promise<PlayerSession> {
  return requestJson("/api/players/recover", { method: "POST", body: JSON.stringify({ recoveryCode }) });
}

export async function getCurrentPlayer(token: string, signal?: AbortSignal): Promise<PlayerProfile> {
  return (await requestJson<{ player: PlayerProfile }>("/api/players/me", withSignal(signal), token)).player;
}

export async function updateCurrentPlayer(token: string, nickname: string, avatarId: string): Promise<PlayerProfile> {
  return (await requestJson<{ player: PlayerProfile }>("/api/players/me", { method: "PATCH", body: JSON.stringify({ nickname, avatarId }) }, token)).player;
}

export async function startAttempt(token: string, slug: string, signal?: AbortSignal): Promise<QuizAttempt> {
  return (await requestJson<{ attempt: QuizAttempt }>(`/api/points/${encodeURIComponent(slug)}/attempts`, { method: "POST", ...withSignal(signal) }, token)).attempt;
}

export function answerAttempt(token: string, attemptId: string, questionId: string, optionId: string): Promise<AttemptAnswerResponse> {
  return requestJson(`/api/attempts/${encodeURIComponent(attemptId)}/answers`, { method: "POST", body: JSON.stringify({ questionId, optionId }) }, token);
}

export async function getProgress(token: string, signal?: AbortSignal): Promise<PlayerProgress> {
  return (await requestJson<{ progress: PlayerProgress }>("/api/progress", withSignal(signal), token)).progress;
}

export function getLeaderboard(token?: string, signal?: AbortSignal): Promise<LeaderboardResponse> {
  return requestJson("/api/leaderboard?limit=20", withSignal(signal), token);
}
