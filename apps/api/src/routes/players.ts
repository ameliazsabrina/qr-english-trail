import type { FastifyInstance } from "fastify";
import type { Database } from "../db/client.js";
import { createPlayer, findPlayerByRecoveryCode, updatePlayer } from "../repositories/players.js";
import { createSession } from "../repositories/sessions.js";
import { hashRecoveryCode, normalizeRecoveryCode, type AuthSecrets } from "../services/auth.js";
import { parseProfileInput, publicPlayer } from "../services/players.js";
import { requirePlayer } from "./auth.js";

const attempts = new Map<string, number[]>();
function rateLimited(key: string, now = Date.now()): boolean {
  const recent = (attempts.get(key) ?? []).filter((time) => time > now - 10 * 60_000);
  recent.push(now);
  attempts.set(key, recent);
  return recent.length > 10;
}

export function registerPlayerRoutes(app: FastifyInstance, database: Database, secrets: AuthSecrets) {
  app.post<{ Body: unknown }>("/api/players", async (request, reply) => {
    if (rateLimited(`create:${request.ip}`)) return reply.status(429).send({ error: { code: "RATE_LIMITED", message: "Please wait before trying again." } });
    const input = parseProfileInput(request.body);
    if (!input) return reply.status(400).send({ error: { code: "INVALID_PROFILE", message: "Enter a nickname and choose an available avatar." } });
    const created = createPlayer(database, secrets, input);
    const sessionToken = createSession(database, secrets, created.id);
    reply.header("Cache-Control", "no-store");
    return reply.status(201).send({ player: created.player, sessionToken, recoveryCode: created.recoveryCode });
  });

  app.post<{ Body: { recoveryCode?: unknown } }>("/api/players/recover", async (request, reply) => {
    if (rateLimited(`recover:${request.ip}`)) return reply.status(429).send({ error: { code: "RATE_LIMITED", message: "Please wait before trying again." } });
    const code = request.body?.recoveryCode;
    const normalized = typeof code === "string" ? normalizeRecoveryCode(code) : "";
    const player = normalized.length >= 12 ? findPlayerByRecoveryCode(database, hashRecoveryCode(normalized, secrets.recoveryPepper)) : undefined;
    if (!player) return reply.status(401).send({ error: { code: "RECOVERY_FAILED", message: "The recovery code could not be verified." } });
    const sessionToken = createSession(database, secrets, player.id);
    reply.header("Cache-Control", "no-store");
    return { player: publicPlayer(player), sessionToken };
  });

  app.get("/api/players/me", async (request, reply) => {
    const player = requirePlayer(request, reply, database, secrets);
    if (!player) return;
    reply.header("Cache-Control", "no-store");
    return { player: publicPlayer(player) };
  });

  app.patch<{ Body: unknown }>("/api/players/me", async (request, reply) => {
    const player = requirePlayer(request, reply, database, secrets);
    if (!player) return;
    const input = parseProfileInput(request.body);
    if (!input) return reply.status(400).send({ error: { code: "INVALID_PROFILE", message: "Enter a nickname and choose an available avatar." } });
    return { player: updatePlayer(database, player.id, input) };
  });
}
