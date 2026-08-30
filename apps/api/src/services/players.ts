import type { PlayerProfile } from "@bonjotan/shared-types";

export const PLAYER_AVATARS = [1, 2, 3, 4, 5].map((number) => `/assets/avatars/${number}.png`);

export function parseProfileInput(value: unknown): { nickname: string; avatarId: string } | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const nicknameValue = "nickname" in value ? value.nickname : "name" in value ? value.name : undefined;
  const avatarValue = "avatarId" in value ? value.avatarId : "avatar" in value ? value.avatar : undefined;
  if (typeof nicknameValue !== "string" || typeof avatarValue !== "string") return undefined;
  const nickname = nicknameValue.trim().replace(/\s+/g, " ");
  if (nickname.length < 1 || nickname.length > 40 || !PLAYER_AVATARS.includes(avatarValue)) return undefined;
  return { nickname, avatarId: avatarValue };
}

export function publicPlayer(row: { public_player_id: string; nickname: string; avatar_id: string }): PlayerProfile {
  return { publicPlayerId: row.public_player_id, nickname: row.nickname, avatarId: row.avatar_id };
}
