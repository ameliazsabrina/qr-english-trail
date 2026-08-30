import { afterEach, describe, expect, it } from "vitest";
import { learningPoints } from "@bonjotan/content";
import { createApp } from "./app.js";
import { createTestDatabase } from "./db/test-database.js";

const apps: Awaited<ReturnType<typeof createApp>>[] = [];
afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())));

describe("content API", () => {
  it("lists ten active points", async () => {
    const app = await createApp({ WEB_ORIGIN: "http://localhost:5173" });
    apps.push(app);
    const response = await app.inject({ method: "GET", url: "/api/points" });
    expect(response.statusCode).toBe(200);
    expect(response.json().points).toHaveLength(10);
  });

  it("does not expose question answer keys on a point response", async () => {
    const app = await createApp({ WEB_ORIGIN: "http://localhost:5173" });
    apps.push(app);
    const response = await app.inject({ method: "GET", url: "/api/points/greetings" });
    expect(response.statusCode).toBe(200);
    expect(response.body).not.toContain("correctOptionId");
    expect(response.json().point.questionCount).toBe(5);
  });

  it("serves five unique safe questions for a valid QR point", async () => {
    const app = await createApp({ WEB_ORIGIN: "http://localhost:5173" });
    apps.push(app);
    const response = await app.inject({ method: "GET", url: "/api/points/greetings/quiz" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.json().questions).toHaveLength(5);
    expect(new Set(response.json().questions.map((question: { id: string }) => question.id)).size).toBe(5);
    expect(response.body).not.toContain("correctOptionId");
    expect(response.body).not.toContain("acceptedAnswers");
  });

  it("routes every QR slug to questions from its own topic", async () => {
    const app = await createApp({ WEB_ORIGIN: "http://localhost:5173" }, () => 0);
    apps.push(app);

    for (const point of learningPoints) {
      const response = await app.inject({ method: "GET", url: `/api/points/${point.slug}/quiz` });
      const questions = response.json().questions as Array<{ id: string; topic: string }>;
      const pointQuestionIds = new Set(point.questions.map(({ id }) => id));

      expect(response.statusCode).toBe(200);
      expect(questions.every(({ id }) => pointQuestionIds.has(id))).toBe(true);
      expect(questions.every(({ topic }) => topic === point.topic)).toBe(true);
    }
  });

  it("returns a friendly error for an unknown QR slug", async () => {
    const app = await createApp({ WEB_ORIGIN: "http://localhost:5173" });
    apps.push(app);
    const response = await app.inject({ method: "GET", url: "/api/points/not-a-point" });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("POINT_NOT_FOUND");
  });

  it("returns 404 for a quiz on an unknown QR slug", async () => {
    const app = await createApp({ WEB_ORIGIN: "http://localhost:5173" });
    apps.push(app);
    const response = await app.inject({ method: "GET", url: "/api/points/not-a-point/quiz" });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("POINT_NOT_FOUND");
  });

  it("returns 404 for a quiz on an inactive QR slug", async () => {
    const point = learningPoints.find(({ slug }) => slug === "greetings")!;
    const originalStatus = point.status;
    const app = await createApp({ WEB_ORIGIN: "http://localhost:5173" });
    apps.push(app);
    try {
      point.status = "inactive";
      const response = await app.inject({ method: "GET", url: "/api/points/greetings/quiz" });
      expect(response.statusCode).toBe(404);
      expect(response.json().error.code).toBe("POINT_NOT_FOUND");
    } finally {
      point.status = originalStatus;
    }
  });
});

const profile = { nickname: "Rara", avatarId: "/assets/avatars/1.png" };

async function createPlayer(app: Awaited<ReturnType<typeof createApp>>, input = profile) {
  const response = await app.inject({ method: "POST", url: "/api/players", payload: input });
  expect(response.statusCode).toBe(201);
  return response.json() as { player: { publicPlayerId: string; nickname: string }; sessionToken: string; recoveryCode: string };
}

async function startAttempt(app: Awaited<ReturnType<typeof createApp>>, token: string, slug = "greetings") {
  const response = await app.inject({ method: "POST", url: `/api/points/${slug}/attempts`, headers: { authorization: `Bearer ${token}` } });
  expect(response.statusCode).toBe(201);
  return response.json().attempt as { id: string; mode: string; questions: Array<{ id: string; options: Array<{ id: string }> }> };
}

async function answer(app: Awaited<ReturnType<typeof createApp>>, token: string, attemptId: string, questionId: string, optionId = "a") {
  return app.inject({ method: "POST", url: `/api/attempts/${attemptId}/answers`, headers: { authorization: `Bearer ${token}` }, payload: { questionId, optionId } });
}

describe("player, attempts, progress, and leaderboard API", () => {
  it("creates a session, authenticates it, updates the profile, and recovers the same player", async () => {
    const app = await createApp({ WEB_ORIGIN: "http://localhost:5173" }); apps.push(app);
    const created = await createPlayer(app);
    expect(created.sessionToken.length).toBeGreaterThan(32);
    expect(created.recoveryCode).toMatch(/^BJN-/);
    expect(JSON.stringify(created)).not.toContain("Hash");

    const unauthorized = await app.inject({ method: "GET", url: "/api/players/me" });
    expect(unauthorized.statusCode).toBe(401);
    const me = await app.inject({ method: "GET", url: "/api/players/me", headers: { authorization: `Bearer ${created.sessionToken}` } });
    expect(me.json().player.publicPlayerId).toBe(created.player.publicPlayerId);

    const updated = await app.inject({ method: "PATCH", url: "/api/players/me", headers: { authorization: `Bearer ${created.sessionToken}` }, payload: { nickname: "Rara Baru", avatarId: "/assets/avatars/2.png" } });
    expect(updated.json().player.nickname).toBe("Rara Baru");

    const recovered = await app.inject({ method: "POST", url: "/api/players/recover", payload: { recoveryCode: created.recoveryCode.toLowerCase() } });
    expect(recovered.statusCode).toBe(200);
    expect(recovered.json().player.publicPlayerId).toBe(created.player.publicPlayerId);
    expect(recovered.json().sessionToken).not.toBe(created.sessionToken);
    const bad = await app.inject({ method: "POST", url: "/api/players/recover", payload: { recoveryCode: "BJN-NOPE-NOPE-NOPE" } });
    expect(bad.statusCode).toBe(401);
    expect(bad.json().error.code).toBe("RECOVERY_FAILED");
  });

  it("binds safe questions to an attempt, finalizes 520 points, then switches to Practice Mode", async () => {
    const app = await createApp({ WEB_ORIGIN: "http://localhost:5173" }, () => 0); apps.push(app);
    const created = await createPlayer(app);
    const attempt = await startAttempt(app, created.sessionToken);
    expect(attempt.mode).toBe("eligible");
    expect(attempt.questions).toHaveLength(5);
    expect(JSON.stringify(attempt)).not.toContain("correctOptionId");

    let final: Awaited<ReturnType<typeof answer>> | undefined;
    for (const question of attempt.questions) final = await answer(app, created.sessionToken, attempt.id, question.id);
    expect(final!.statusCode).toBe(200);
    expect(final!.json().completion.awardedScore).toBe(520);
    expect(final!.json().completion.progress).toMatchObject({ totalScore: 520, completedPointCount: 1 });

    const progress = await app.inject({ method: "GET", url: "/api/progress", headers: { authorization: `Bearer ${created.sessionToken}` } });
    expect(progress.json().progress.completedPointIds).toEqual(["point-01"]);
    const practice = await startAttempt(app, created.sessionToken);
    expect(practice.mode).toBe("practice");

    let practiceFinal: Awaited<ReturnType<typeof answer>> | undefined;
    for (const question of practice.questions) practiceFinal = await answer(app, created.sessionToken, practice.id, question.id);
    expect(practiceFinal!.json().completion.awardedScore).toBe(0);
    expect(practiceFinal!.json().completion.progress.totalScore).toBe(520);
  });

  it("makes answer retries idempotent and rejects changing an answer", async () => {
    const app = await createApp({ WEB_ORIGIN: "http://localhost:5173" }, () => 0); apps.push(app);
    const created = await createPlayer(app); const attempt = await startAttempt(app, created.sessionToken);
    const question = attempt.questions[0]!;
    const first = await answer(app, created.sessionToken, attempt.id, question.id, "a");
    const retry = await answer(app, created.sessionToken, attempt.id, question.id, "a");
    expect(retry.json()).toEqual(first.json());
    const changed = await answer(app, created.sessionToken, attempt.id, question.id, "b");
    expect(changed.statusCode).toBe(409);
    expect(changed.json().error.code).toBe("ANSWER_ALREADY_SUBMITTED");
  });

  it("awards a concurrent pair of eligible attempts exactly once", async () => {
    const app = await createApp({ WEB_ORIGIN: "http://localhost:5173" }, () => 0); apps.push(app);
    const created = await createPlayer(app); const first = await startAttempt(app, created.sessionToken); const second = await startAttempt(app, created.sessionToken);
    for (let index = 0; index < 4; index += 1) {
      await answer(app, created.sessionToken, first.id, first.questions[index]!.id);
      await answer(app, created.sessionToken, second.id, second.questions[index]!.id);
    }
    const results = await Promise.all([
      answer(app, created.sessionToken, first.id, first.questions[4]!.id),
      answer(app, created.sessionToken, second.id, second.questions[4]!.id),
    ]);
    expect(results.map((response) => response.json().completion.awardedScore).sort((a, b) => a - b)).toEqual([0, 520]);
    expect(results[0]!.json().completion.progress.totalScore).toBe(520);
  });

  it("returns a deterministic sanitized leaderboard and highlights the current player", async () => {
    const app = await createApp({ WEB_ORIGIN: "http://localhost:5173" }, () => 0); apps.push(app);
    const created = await createPlayer(app); const attempt = await startAttempt(app, created.sessionToken);
    for (const question of attempt.questions) await answer(app, created.sessionToken, attempt.id, question.id);
    const response = await app.inject({ method: "GET", url: "/api/leaderboard?limit=500", headers: { authorization: `Bearer ${created.sessionToken}` } });
    expect(response.statusCode).toBe(200);
    expect(response.json().entries[0]).toEqual({ rank: 1, nickname: "Rara", avatarId: "/assets/avatars/1.png", totalScore: 520, completedPointCount: 1, isCurrentPlayer: true });
    expect(response.body).not.toContain("publicPlayerId");
    expect(response.body).not.toContain("recovery");
    expect(response.body).not.toContain("player_id");
  });

  it("returns the current player separately when they rank outside the top 20", async () => {
    const database = createTestDatabase();
    const app = await createApp({ WEB_ORIGIN: "http://localhost:5173" }, () => 0, database);
    try {
      const created = await createPlayer(app);
      const current = database.sqlite.prepare("SELECT id FROM players WHERE public_player_id = ?").get(created.player.publicPlayerId) as { id: string };
      const insertPlayer = database.sqlite.prepare(`INSERT INTO players
        (id, public_player_id, nickname, normalized_nickname, avatar_id, recovery_code_hash, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, '/assets/avatars/1.png', ?, 'active', ?, ?)`);
      const insertAttempt = database.sqlite.prepare(`INSERT INTO quiz_attempts
        (id, player_id, point_id, mode, status, content_version, awarded_score, issued_at, expires_at, submitted_at)
        VALUES (?, ?, 'point-01', 'eligible', 'submitted', 'v1', ?, ?, ?, ?)`);
      const insertCompletion = database.sqlite.prepare(`INSERT INTO point_completions
        (id, player_id, point_id, eligible_attempt_id, awarded_score, content_version, completed_at)
        VALUES (?, ?, 'point-01', ?, ?, 'v1', ?)`);
      database.sqlite.transaction(() => {
        const currentAttempt = "current-attempt";
        insertAttempt.run(currentAttempt, current.id, 20, 1, 2, 2);
        insertCompletion.run("current-completion", current.id, currentAttempt, 20, 2);
        for (let index = 0; index < 20; index += 1) {
          const playerId = `bot-${index}`; const attemptId = `bot-attempt-${index}`;
          insertPlayer.run(playerId, `bot-public-${index}`, `Explorer ${index}`, `explorer ${index}`, `bot-recovery-${index}`, index + 10, index + 10);
          insertAttempt.run(attemptId, playerId, 520, index + 10, index + 20, index + 20);
          insertCompletion.run(`bot-completion-${index}`, playerId, attemptId, 520, index + 20);
        }
      })();
      const response = await app.inject({ method: "GET", url: "/api/leaderboard?limit=20", headers: { authorization: `Bearer ${created.sessionToken}` } });
      expect(response.json().entries).toHaveLength(20);
      expect(response.json().currentPlayer).toMatchObject({ rank: 21, nickname: "Rara", isCurrentPlayer: true });
    } finally {
      await app.close(); database.close();
    }
  });
});
