import type { Database } from "../db/client.js";
import { generateRecoveryCode, hashRecoveryCode, randomUUID, type AuthSecrets } from "../services/auth.js";
import { publicPlayer } from "../services/players.js";

export type PlayerRow = { id: string; public_player_id: string; nickname: string; avatar_id: string; status: string };

export function createPlayer(database: Database, secrets: AuthSecrets, input: { nickname: string; avatarId: string }) {
  const id = randomUUID();
  const publicPlayerId = randomUUID();
  const recoveryCode = generateRecoveryCode();
  const now = Date.now();
  database.sqlite.prepare(`INSERT INTO players
    (id, public_player_id, nickname, normalized_nickname, avatar_id, recovery_code_hash, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`)
    .run(id, publicPlayerId, input.nickname, input.nickname.toLocaleLowerCase("en"), input.avatarId, hashRecoveryCode(recoveryCode, secrets.recoveryPepper), now, now);
  return { id, player: { publicPlayerId, nickname: input.nickname, avatarId: input.avatarId }, recoveryCode };
}

export function findPlayerById(database: Database, id: string): PlayerRow | undefined {
  return database.sqlite.prepare("SELECT id, public_player_id, nickname, avatar_id, status FROM players WHERE id = ?").get(id) as PlayerRow | undefined;
}

export function findPlayerByRecoveryCode(database: Database, hash: string): PlayerRow | undefined {
  return database.sqlite.prepare("SELECT id, public_player_id, nickname, avatar_id, status FROM players WHERE recovery_code_hash = ? AND status != 'disabled'").get(hash) as PlayerRow | undefined;
}

export function updatePlayer(database: Database, id: string, input: { nickname: string; avatarId: string }) {
  database.sqlite.prepare("UPDATE players SET nickname = ?, normalized_nickname = ?, avatar_id = ?, updated_at = ? WHERE id = ?")
    .run(input.nickname, input.nickname.toLocaleLowerCase("en"), input.avatarId, Date.now(), id);
  const row = findPlayerById(database, id);
  return row ? publicPlayer(row) : undefined;
}
