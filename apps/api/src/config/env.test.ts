import { describe, expect, it } from "vitest";
import { readEnv } from "./env.js";

describe("environment validation", () => {
  it("rejects development authentication secrets in production", () => {
    expect(() => readEnv({ NODE_ENV: "production" })).toThrow();
  });

  it("accepts distinct production peppers", () => {
    const env = readEnv({
      NODE_ENV: "production",
      SESSION_TOKEN_PEPPER: "s".repeat(32),
      RECOVERY_CODE_PEPPER: "r".repeat(32),
    });
    expect(env.NODE_ENV).toBe("production");
  });
});
