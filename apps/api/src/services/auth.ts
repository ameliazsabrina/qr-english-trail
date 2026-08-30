import { createHmac, randomBytes, randomUUID } from "node:crypto";

export type AuthSecrets = {
  sessionPepper: string;
  recoveryPepper: string;
  sessionLifetimeDays: number;
};

function hash(value: string, pepper: string): string {
  return createHmac("sha256", pepper).update(value).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string, pepper: string): string {
  return hash(token, pepper);
}

export function normalizeRecoveryCode(code: string): string {
  return code.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function generateRecoveryCode(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(12);
  const value = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `BJN-${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8)}`;
}

export function hashRecoveryCode(code: string, pepper: string): string {
  return hash(normalizeRecoveryCode(code), pepper);
}

export { randomUUID };
