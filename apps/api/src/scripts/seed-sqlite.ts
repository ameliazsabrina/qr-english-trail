import { learningPoints } from "@bonjotan/content";
import { readEnv } from "../config/env.js";
import { openDatabase } from "../db/client.js";
import { hashRecoveryCode } from "../services/auth.js";

const env = readEnv();
if (env.NODE_ENV === "production") throw new Error("SQLite seed is disabled when NODE_ENV=production");
const database = openDatabase(env.SQLITE_PATH);

const fixtures = [
  { id: "seed-ayu", publicId: "seed-public-ayu", nickname: "Ayu Explorer", avatar: "/assets/avatars/1.png", code: "BJN-AYU7-DEMO-2026", points: 3, correct: 5 },
  { id: "seed-bima", publicId: "seed-public-bima", nickname: "Bima Brave", avatar: "/assets/avatars/2.png", code: "BJN-BIM4-DEMO-2026", points: 2, correct: 3 },
  { id: "seed-cici", publicId: "seed-public-cici", nickname: "Cici Ceria", avatar: "/assets/avatars/3.png", code: "BJN-CIC1-DEMO-2026", points: 1, correct: 0 },
] as const;

database.sqlite.transaction(() => {
  for (const [playerIndex, fixture] of fixtures.entries()) {
    const createdAt = Date.UTC(2026, 7, 1 + playerIndex);
    database.sqlite.prepare(`INSERT INTO players
      (id, public_player_id, nickname, normalized_nickname, avatar_id, recovery_code_hash, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
      ON CONFLICT(id) DO UPDATE SET nickname=excluded.nickname, normalized_nickname=excluded.normalized_nickname,
      avatar_id=excluded.avatar_id, recovery_code_hash=excluded.recovery_code_hash, updated_at=excluded.updated_at`)
      .run(fixture.id, fixture.publicId, fixture.nickname, fixture.nickname.toLocaleLowerCase("en"), fixture.avatar, hashRecoveryCode(fixture.code, env.RECOVERY_CODE_PEPPER), createdAt, createdAt);

    for (let pointIndex = 0; pointIndex < fixture.points; pointIndex += 1) {
      const point = learningPoints[pointIndex]!;
      const attemptId = `seed-attempt-${fixture.id}-${point.id}`;
      const completedAt = createdAt + (pointIndex + 1) * 60_000;
      const correctAnswers = Math.min(5, fixture.correct);
      const score = correctAnswers * 100 + 20;
      database.sqlite.prepare(`INSERT INTO quiz_attempts
        (id, player_id, point_id, mode, status, content_version, awarded_score, issued_at, expires_at, submitted_at)
        VALUES (?, ?, ?, 'eligible', 'submitted', ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET awarded_score=excluded.awarded_score, submitted_at=excluded.submitted_at`)
        .run(attemptId, fixture.id, point.id, point.contentVersion, score, completedAt - 30_000, completedAt + 30_000, completedAt);
      const insertQuestion = database.sqlite.prepare(`INSERT INTO attempt_questions
        (attempt_id, question_id, position, submitted_answer, correct, awarded_score, answered_at)
        VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(attempt_id, question_id) DO UPDATE SET
        submitted_answer=excluded.submitted_answer, correct=excluded.correct, awarded_score=excluded.awarded_score, answered_at=excluded.answered_at`);
      point.questions.slice(0, 5).forEach((question, index) => {
        const correct = index < correctAnswers;
        const answer = correct ? question.correctOptionId! : question.options!.find(({ id }) => id !== question.correctOptionId)!.id;
        insertQuestion.run(attemptId, question.id, index, answer, correct ? 1 : 0, correct ? 100 : 0, completedAt);
      });
      database.sqlite.prepare(`INSERT INTO point_completions
        (id, player_id, point_id, eligible_attempt_id, awarded_score, content_version, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(player_id, point_id) DO UPDATE SET
        awarded_score=excluded.awarded_score, content_version=excluded.content_version, completed_at=excluded.completed_at`)
        .run(`seed-completion-${fixture.id}-${point.id}`, fixture.id, point.id, attemptId, score, point.contentVersion, completedAt);
    }
  }
})();

database.close();
console.info(`Seeded ${fixtures.length} demo players into ${env.SQLITE_PATH}.`);
console.info(`Demo recovery codes: ${fixtures.map(({ code }) => code).join(", ")}`);
