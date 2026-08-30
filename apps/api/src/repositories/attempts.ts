import type { AttemptAnswerResponse, QuizAttempt } from "@bonjotan/shared-types";
import type { Database } from "../db/client.js";
import { randomUUID } from "../services/auth.js";
import { getActivePoint, getQuestionResult, selectAttemptQuestions, type RandomSource } from "../services/content.js";
import { getProgress } from "./progress.js";

export class AttemptError extends Error {
  constructor(public statusCode: number, public code: string, message: string) { super(message); }
}

type AttemptRow = {
  id: string; player_id: string; point_id: string; mode: "eligible" | "practice";
  status: "issued" | "submitted" | "expired"; content_version: string;
  awarded_score: number; expires_at: number;
};

type AnswerRow = { submitted_answer: string | null; correct: number | null };

export function createAttempt(database: Database, playerId: string, slug: string, random: RandomSource): QuizAttempt {
  const point = getActivePoint(slug);
  const questions = selectAttemptQuestions(slug, random);
  if (!point || !questions) throw new AttemptError(404, "POINT_NOT_FOUND", "We could not find that English Point.");
  if (questions.length !== 5) throw new AttemptError(409, "POINT_NOT_READY", "This English Point does not have enough questions yet.");
  const completion = database.sqlite.prepare("SELECT 1 FROM point_completions WHERE player_id = ? AND point_id = ?").get(playerId, point.id);
  const mode = completion ? "practice" : "eligible";
  const id = randomUUID();
  const now = Date.now();
  const expiresAt = now + 30 * 60_000;
  database.sqlite.transaction(() => {
    database.sqlite.prepare(`INSERT INTO quiz_attempts
      (id, player_id, point_id, mode, status, content_version, awarded_score, issued_at, expires_at)
      VALUES (?, ?, ?, ?, 'issued', ?, 0, ?, ?)`)
      .run(id, playerId, point.id, mode, point.contentVersion, now, expiresAt);
    const insert = database.sqlite.prepare("INSERT INTO attempt_questions (attempt_id, question_id, position, awarded_score) VALUES (?, ?, ?, 0)");
    questions.forEach((question, position) => insert.run(id, question.id, position));
  })();
  return { id, mode, expiresAt: new Date(expiresAt).toISOString(), questions };
}

function loadAttempt(database: Database, attemptId: string): AttemptRow | undefined {
  return database.sqlite.prepare(`SELECT id, player_id, point_id, mode, status, content_version, awarded_score, expires_at
    FROM quiz_attempts WHERE id = ?`).get(attemptId) as AttemptRow | undefined;
}

function completionResponse(database: Database, attempt: AttemptRow) {
  const summary = database.sqlite.prepare(`SELECT COUNT(*) AS question_count, SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) AS correct_answers
    FROM attempt_questions WHERE attempt_id = ?`).get(attempt.id) as { question_count: number; correct_answers: number };
  return {
    attemptId: attempt.id,
    mode: attempt.mode,
    correctAnswers: summary.correct_answers,
    questionCount: summary.question_count,
    awardedScore: attempt.awarded_score,
    progress: getProgress(database, attempt.player_id),
  };
}

export function answerAttempt(database: Database, playerId: string, attemptId: string, questionId: string, optionId: string): AttemptAnswerResponse {
  return database.sqlite.transaction(() => {
    const attempt = loadAttempt(database, attemptId);
    if (!attempt || attempt.player_id !== playerId) throw new AttemptError(404, "ATTEMPT_NOT_FOUND", "That quiz attempt is not available.");
    if (attempt.status === "expired" || (attempt.status === "issued" && attempt.expires_at <= Date.now())) {
      if (attempt.status === "issued") database.sqlite.prepare("UPDATE quiz_attempts SET status = 'expired' WHERE id = ?").run(attempt.id);
      throw new AttemptError(410, "ATTEMPT_EXPIRED", "This quiz attempt has expired. Start a new one.");
    }
    const answer = database.sqlite.prepare("SELECT submitted_answer, correct FROM attempt_questions WHERE attempt_id = ? AND question_id = ?")
      .get(attemptId, questionId) as AnswerRow | undefined;
    if (!answer) throw new AttemptError(400, "QUESTION_NOT_ASSIGNED", "That question is not part of this attempt.");
    const result = getQuestionResult(attempt.point_id, attempt.content_version, questionId, optionId);
    if (!result) throw new AttemptError(400, "INVALID_ANSWER", "Choose one of the available answers.");
    if (answer.submitted_answer !== null && answer.submitted_answer !== optionId) {
      throw new AttemptError(409, "ANSWER_ALREADY_SUBMITTED", "An answer for this question has already been recorded.");
    }
    if (answer.submitted_answer === null) {
      database.sqlite.prepare(`UPDATE attempt_questions SET submitted_answer = ?, correct = ?, awarded_score = ?, answered_at = ?
        WHERE attempt_id = ? AND question_id = ?`)
        .run(optionId, result.correct ? 1 : 0, attempt.mode === "eligible" && result.correct ? 100 : 0, Date.now(), attemptId, questionId);
    }
    const unanswered = database.sqlite.prepare("SELECT COUNT(*) AS count FROM attempt_questions WHERE attempt_id = ? AND submitted_answer IS NULL")
      .get(attemptId) as { count: number };
    if (unanswered.count > 0) return { result };

    let refreshed = loadAttempt(database, attemptId)!;
    if (refreshed.status !== "submitted") {
      const scoreRow = database.sqlite.prepare("SELECT SUM(awarded_score) AS score FROM attempt_questions WHERE attempt_id = ?")
        .get(attemptId) as { score: number };
      let awardedScore = 0;
      if (refreshed.mode === "eligible") {
        const candidateScore = scoreRow.score + 20;
        try {
          database.sqlite.prepare(`INSERT INTO point_completions
            (id, player_id, point_id, eligible_attempt_id, awarded_score, content_version, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`)
            .run(randomUUID(), playerId, refreshed.point_id, attemptId, candidateScore, refreshed.content_version, Date.now());
          awardedScore = candidateScore;
        } catch (error) {
          if (!(error instanceof Error) || !error.message.includes("UNIQUE constraint failed")) throw error;
        }
      }
      database.sqlite.prepare("UPDATE quiz_attempts SET status = 'submitted', awarded_score = ?, submitted_at = ? WHERE id = ?")
        .run(awardedScore, Date.now(), attemptId);
      refreshed = loadAttempt(database, attemptId)!;
    }
    return { result, completion: completionResponse(database, refreshed) };
  }).immediate();
}
