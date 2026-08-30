export type StoredPlayerSession = { version: 2; token: string };
export type LegacyPlayerProfile = { version: 1; name: string; avatar: string };

const SESSION_KEY = "bonjotanPlayerSession";
const PROFILE_KEY = "bonjotanPlayerProfile";
const LEGACY_NAME_KEY = "bonjotanPlayerName";
const LEGACY_AVATAR_KEY = "bonjotanPlayerAvatar";

export const PLAYER_AVATARS = [1, 2, 3, 4, 5].map((number) => `/assets/avatars/${number}.png`);

function storage(): Storage | undefined {
  try { return globalThis.localStorage; } catch { return undefined; }
}

function validName(value: unknown): value is string {
  return typeof value === "string" && value === value.trim() && value.length > 0 && value.length <= 40;
}

function validAvatar(value: unknown): value is string {
  return typeof value === "string" && PLAYER_AVATARS.includes(value);
}

export function loadPlayerSession(): StoredPlayerSession | undefined {
  try {
    const raw = storage()?.getItem(SESSION_KEY);
    if (!raw) return undefined;
    const value: unknown = JSON.parse(raw);
    if (typeof value === "object" && value !== null && "version" in value && value.version === 2 && "token" in value && typeof value.token === "string" && value.token.length >= 32) {
      return { version: 2, token: value.token };
    }
  } catch { /* unavailable or corrupt storage behaves like a signed-out browser */ }
  return undefined;
}

export function savePlayerSession(token: string): StoredPlayerSession | undefined {
  if (token.length < 32) return undefined;
  const session: StoredPlayerSession = { version: 2, token };
  try {
    const target = storage();
    if (!target) return undefined;
    target.setItem(SESSION_KEY, JSON.stringify(session));
    return target.getItem(SESSION_KEY) ? session : undefined;
  } catch { return undefined; }
}

export function clearPlayerSession(): void {
  try { storage()?.removeItem(SESSION_KEY); } catch { /* no-op */ }
}

export function loadLegacyPlayerProfile(): LegacyPlayerProfile | undefined {
  const target = storage();
  if (!target) return undefined;
  try {
    const raw = target.getItem(PROFILE_KEY);
    if (raw) {
      const value: unknown = JSON.parse(raw);
      if (typeof value === "object" && value !== null && "version" in value && value.version === 1 && "name" in value && validName(value.name) && "avatar" in value && validAvatar(value.avatar)) {
        return { version: 1, name: value.name, avatar: value.avatar };
      }
    }
    const name = target.getItem(LEGACY_NAME_KEY)?.trim();
    const avatar = target.getItem(LEGACY_AVATAR_KEY);
    return validName(name) && validAvatar(avatar) ? { version: 1, name, avatar } : undefined;
  } catch { return undefined; }
}

export function removeLegacyPlayerProfile(): void {
  try {
    const target = storage();
    target?.removeItem(PROFILE_KEY);
    target?.removeItem(LEGACY_NAME_KEY);
    target?.removeItem(LEGACY_AVATAR_KEY);
  } catch { /* cleanup can be retried on the next successful migration */ }
}
