CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY NOT NULL,
  public_player_id TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  normalized_nickname TEXT NOT NULL,
  avatar_id TEXT NOT NULL,
  recovery_code_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','hidden','disabled')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS player_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS player_sessions_player_idx ON player_sessions(player_id);
CREATE INDEX IF NOT EXISTS player_sessions_auth_idx ON player_sessions(token_hash, expires_at);
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY NOT NULL,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  point_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('eligible','practice')),
  status TEXT NOT NULL CHECK (status IN ('issued','submitted','expired')),
  content_version TEXT NOT NULL,
  awarded_score INTEGER NOT NULL DEFAULT 0,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  submitted_at INTEGER
);
CREATE INDEX IF NOT EXISTS quiz_attempts_player_point_idx ON quiz_attempts(player_id, point_id, issued_at);
CREATE TABLE IF NOT EXISTS attempt_questions (
  attempt_id TEXT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  submitted_answer TEXT,
  correct INTEGER,
  awarded_score INTEGER NOT NULL DEFAULT 0,
  answered_at INTEGER,
  PRIMARY KEY (attempt_id, question_id),
  UNIQUE (attempt_id, position)
);
CREATE INDEX IF NOT EXISTS attempt_questions_question_idx ON attempt_questions(question_id);
CREATE TABLE IF NOT EXISTS point_completions (
  id TEXT PRIMARY KEY NOT NULL,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  point_id TEXT NOT NULL,
  eligible_attempt_id TEXT NOT NULL UNIQUE REFERENCES quiz_attempts(id),
  awarded_score INTEGER NOT NULL CHECK (awarded_score BETWEEN 20 AND 520),
  content_version TEXT NOT NULL,
  completed_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS point_completions_player_idx ON point_completions(player_id);
CREATE UNIQUE INDEX IF NOT EXISTS point_completions_player_point_unique ON point_completions(player_id, point_id);
