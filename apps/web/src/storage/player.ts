const PLAYER_ID_KEY = "bonjotanPlayerId";
const PLAYER_NAME_KEY = "bonjotanPlayerName";
const PLAYER_AVATAR_KEY = "bonjotanPlayerAvatar";

export function getRememberedPlayerAvatar(): string | null {
  try {
    return localStorage.getItem(PLAYER_AVATAR_KEY);
  } catch {
    return null;
  }
}

export function rememberPlayerAvatar(avatar: string): boolean {
  try {
    localStorage.setItem(PLAYER_AVATAR_KEY, avatar);
    return true;
  } catch {
    return false;
  }
}

export function forgetPlayerAvatar(): void {
  try {
    localStorage.removeItem(PLAYER_AVATAR_KEY);
  } catch {
    // The app remains usable when browser storage is unavailable.
  }
}

export function getRememberedPlayerName(): string | null {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY);
  } catch {
    return null;
  }
}

export function rememberPlayerName(name: string): boolean {
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name);
    return true;
  } catch {
    return false;
  }
}

export function forgetPlayerName(): void {
  try {
    localStorage.removeItem(PLAYER_NAME_KEY);
  } catch {
    // The app remains usable when browser storage is unavailable.
  }
}

export function getRememberedPlayerId(): string | null {
  try {
    return localStorage.getItem(PLAYER_ID_KEY);
  } catch {
    return null;
  }
}

export function rememberPlayerId(playerId: string): boolean {
  try {
    localStorage.setItem(PLAYER_ID_KEY, playerId);
    return true;
  } catch {
    return false;
  }
}

export function forgetPlayerId(): void {
  try {
    localStorage.removeItem(PLAYER_ID_KEY);
  } catch {
    // The app remains usable when browser storage is unavailable.
  }
}
