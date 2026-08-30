import { afterEach, describe, expect, it, vi } from "vitest";
import { clearPlayerSession, loadLegacyPlayerProfile, loadPlayerSession, removeLegacyPlayerProfile, savePlayerSession } from "./player";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

afterEach(() => vi.unstubAllGlobals());

describe("player session storage", () => {
  it("stores only a version-2 opaque session token", () => {
    const target = new MemoryStorage(); vi.stubGlobal("localStorage", target);
    const token = "a".repeat(43);
    expect(savePlayerSession(token)).toEqual({ version: 2, token });
    expect(loadPlayerSession()).toEqual({ version: 2, token });
    expect(target.length).toBe(1);
  });

  it("reads but does not remove a valid legacy profile before migration succeeds", () => {
    const target = new MemoryStorage();
    target.setItem("bonjotanPlayerProfile", JSON.stringify({ version: 1, name: "Rara", avatar: "/assets/avatars/3.png" }));
    vi.stubGlobal("localStorage", target);
    expect(loadLegacyPlayerProfile()?.name).toBe("Rara");
    expect(target.getItem("bonjotanPlayerProfile")).not.toBeNull();
  });

  it("removes legacy data only when explicitly committed after session storage", () => {
    const target = new MemoryStorage();
    target.setItem("bonjotanPlayerName", "Rara"); target.setItem("bonjotanPlayerAvatar", "/assets/avatars/2.png");
    vi.stubGlobal("localStorage", target);
    expect(savePlayerSession("b".repeat(43))).toBeTruthy();
    removeLegacyPlayerProfile();
    expect(target.getItem("bonjotanPlayerName")).toBeNull();
    expect(loadPlayerSession()?.token).toBe("b".repeat(43));
  });

  it("stays usable when storage is unavailable", () => {
    vi.stubGlobal("localStorage", { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } });
    expect(loadPlayerSession()).toBeUndefined(); expect(savePlayerSession("c".repeat(43))).toBeUndefined();
    expect(() => clearPlayerSession()).not.toThrow();
  });
});
