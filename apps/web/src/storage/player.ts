const PLAYER_ID_KEY = "bonjotanPlayerId";

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

