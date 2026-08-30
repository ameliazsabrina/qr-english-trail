import { describe, expect, it } from "vitest";
import { generateRecoveryCode, generateSessionToken, hashRecoveryCode, hashSessionToken, normalizeRecoveryCode } from "./auth.js";

describe("session and recovery secrets", () => {
  it("generates high-entropy opaque session tokens", () => {
    const first = generateSessionToken(); const second = generateSessionToken();
    expect(first.length).toBeGreaterThanOrEqual(43); expect(second).not.toBe(first);
  });

  it("normalizes recovery codes and hashes raw values deterministically", () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^BJN-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(normalizeRecoveryCode(code.toLowerCase())).toBe(normalizeRecoveryCode(code));
    expect(hashRecoveryCode(code, "recovery-pepper-123")).toBe(hashRecoveryCode(code.toLowerCase(), "recovery-pepper-123"));
    expect(hashSessionToken("raw-token", "session-pepper-123")).not.toContain("raw-token");
  });
});
