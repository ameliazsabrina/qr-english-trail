import { check, index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  publicPlayerId: text("public_player_id").notNull().unique(),
  nickname: text("nickname").notNull(),
  normalizedNickname: text("normalized_nickname").notNull(),
  avatarId: text("avatar_id").notNull(),
  recoveryCodeHash: text("recovery_code_hash").notNull().unique(),
  status: text("status", { enum: ["active", "hidden", "disabled"] }).notNull().default("active"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [check("players_status_check", sql`${table.status} in ('active','hidden','disabled')`)]);

export const playerSessions = sqliteTable("player_sessions", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: integer("created_at").notNull(),
  lastSeenAt: integer("last_seen_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
  revokedAt: integer("revoked_at"),
}, (table) => [index("player_sessions_player_idx").on(table.playerId), index("player_sessions_auth_idx").on(table.tokenHash, table.expiresAt)]);

export const quizAttempts = sqliteTable("quiz_attempts", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  pointId: text("point_id").notNull(),
  mode: text("mode", { enum: ["eligible", "practice"] }).notNull(),
  status: text("status", { enum: ["issued", "submitted", "expired"] }).notNull(),
  contentVersion: text("content_version").notNull(),
  awardedScore: integer("awarded_score").notNull().default(0),
  issuedAt: integer("issued_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
  submittedAt: integer("submitted_at"),
}, (table) => [
  index("quiz_attempts_player_point_idx").on(table.playerId, table.pointId, table.issuedAt),
  check("quiz_attempts_mode_check", sql`${table.mode} in ('eligible','practice')`),
  check("quiz_attempts_status_check", sql`${table.status} in ('issued','submitted','expired')`),
]);

export const attemptQuestions = sqliteTable("attempt_questions", {
  attemptId: text("attempt_id").notNull().references(() => quizAttempts.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull(),
  position: integer("position").notNull(),
  submittedAnswer: text("submitted_answer"),
  correct: integer("correct", { mode: "boolean" }),
  awardedScore: integer("awarded_score").notNull().default(0),
  answeredAt: integer("answered_at"),
}, (table) => [
  primaryKey({ columns: [table.attemptId, table.questionId] }),
  uniqueIndex("attempt_questions_position_unique").on(table.attemptId, table.position),
  index("attempt_questions_question_idx").on(table.questionId),
]);

export const pointCompletions = sqliteTable("point_completions", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  pointId: text("point_id").notNull(),
  eligibleAttemptId: text("eligible_attempt_id").notNull().unique().references(() => quizAttempts.id),
  awardedScore: integer("awarded_score").notNull(),
  contentVersion: text("content_version").notNull(),
  completedAt: integer("completed_at").notNull(),
}, (table) => [
  uniqueIndex("point_completions_player_point_unique").on(table.playerId, table.pointId),
  index("point_completions_player_idx").on(table.playerId),
  check("point_completions_score_check", sql`${table.awardedScore} between 20 and 520`),
]);
