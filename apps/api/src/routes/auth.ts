import type { FastifyReply, FastifyRequest } from "fastify";
import type { Database } from "../db/client.js";
import type { AuthSecrets } from "../services/auth.js";
import { authenticateSession } from "../repositories/sessions.js";

export function bearerToken(request: FastifyRequest): string | undefined {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return undefined;
  const token = authorization.slice(7).trim();
  return token || undefined;
}

export function requirePlayer(request: FastifyRequest, reply: FastifyReply, database: Database, secrets: AuthSecrets) {
  const token = bearerToken(request);
  const player = token ? authenticateSession(database, secrets, token) : undefined;
  if (!player) {
    void reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "A valid player session is required." } });
    return undefined;
  }
  return player;
}
