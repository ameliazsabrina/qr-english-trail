import type { Database } from "../db/client.js";
import { generateSessionToken, hashSessionToken, randomUUID, type AuthSecrets } from "../services/auth.js";
import { findPlayerById, type PlayerRow } from "./players.js";

export function createSession(database: Database, secrets: AuthSecrets, playerId: string): string {
  const token = generateSessionToken();
  const now = Date.now();
  const expiresAt = now + secrets.sessionLifetimeDays * 86_400_000;
  database.sqlite.prepare(`INSERT INTO player_sessions
    (id, player_id, token_hash, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(randomUUID(), playerId, hashSessionToken(token, secrets.sessionPepper), now, now, expiresAt);
  return token;
}

export function authenticateSession(database: Database, secrets: AuthSecrets, token: string): PlayerRow | undefined {
  const now = Date.now();
  const row = database.sqlite.prepare(`SELECT player_id FROM player_sessions
    WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?`)
    .get(hashSessionToken(token, secrets.sessionPepper), now) as { player_id: string } | undefined;
  if (!row) return undefined;
  database.sqlite.prepare("UPDATE player_sessions SET last_seen_at = ? WHERE token_hash = ?")
    .run(now, hashSessionToken(token, secrets.sessionPepper));
  const player = findPlayerById(database, row.player_id);
  return player?.status === "disabled" ? undefined : player;
}
