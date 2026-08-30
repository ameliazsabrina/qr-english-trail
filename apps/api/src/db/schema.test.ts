import { describe, expect, it } from "vitest";
import { openDatabase, assertMigrationsCurrent } from "./client.js";
import { createTestDatabase } from "./test-database.js";

describe("SQLite migrations and constraints", () => {
  it("creates every authoritative table and required indexes", () => {
    const database = createTestDatabase();
    try {
      const tables = database.sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").pluck().all();
      expect(tables).toEqual(expect.arrayContaining(["players", "player_sessions", "quiz_attempts", "attempt_questions", "point_completions"]));
      const indexes = database.sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").pluck().all();
      expect(indexes).toEqual(expect.arrayContaining(["quiz_attempts_player_point_idx", "point_completions_player_point_unique"]));
    } finally { database.close(); }
  });

  it("rejects orphaned sessions and duplicate player-point completions", () => {
    const database = createTestDatabase();
    try {
      expect(() => database.sqlite.prepare(`INSERT INTO player_sessions
        (id, player_id, token_hash, created_at, last_seen_at, expires_at) VALUES ('s', 'missing', 'h', 1, 1, 2)`).run()).toThrow(/FOREIGN KEY/);
      database.sqlite.prepare(`INSERT INTO players
        (id, public_player_id, nickname, normalized_nickname, avatar_id, recovery_code_hash, status, created_at, updated_at)
        VALUES ('p', 'pub', 'P', 'p', '/assets/avatars/1.png', 'recovery', 'active', 1, 1)`).run();
      for (const id of ["a1", "a2"]) database.sqlite.prepare(`INSERT INTO quiz_attempts
        (id, player_id, point_id, mode, status, content_version, awarded_score, issued_at, expires_at, submitted_at)
        VALUES (?, 'p', 'point-01', 'eligible', 'submitted', 'v1', 20, 1, 2, 2)`).run(id);
      database.sqlite.prepare(`INSERT INTO point_completions
        (id, player_id, point_id, eligible_attempt_id, awarded_score, content_version, completed_at)
        VALUES ('c1', 'p', 'point-01', 'a1', 20, 'v1', 2)`).run();
      expect(() => database.sqlite.prepare(`INSERT INTO point_completions
        (id, player_id, point_id, eligible_attempt_id, awarded_score, content_version, completed_at)
        VALUES ('c2', 'p', 'point-01', 'a2', 20, 'v1', 3)`).run()).toThrow(/UNIQUE/);
    } finally { database.close(); }
  });

  it("fails startup when the explicit migration step has not run", () => {
    const database = openDatabase(":memory:", false);
    try { expect(() => assertMigrationsCurrent(database.sqlite)).toThrow(/db:migrate/); }
    finally { database.close(); }
  });
});
