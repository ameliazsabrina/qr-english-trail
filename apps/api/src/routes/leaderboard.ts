import type { FastifyInstance } from "fastify";
import type { Database } from "../db/client.js";
import { getLeaderboard } from "../repositories/leaderboard.js";
import { authenticateSession } from "../repositories/sessions.js";
import type { AuthSecrets } from "../services/auth.js";
import { bearerToken } from "./auth.js";

export function registerLeaderboardRoutes(app: FastifyInstance, database: Database, secrets: AuthSecrets) {
  app.get<{ Querystring: { limit?: string } }>("/api/leaderboard", async (request, reply) => {
    const parsed = Number.parseInt(request.query.limit ?? "20", 10);
    const limit = Number.isFinite(parsed) ? Math.min(100, Math.max(1, parsed)) : 20;
    const token = bearerToken(request);
    const player = token ? authenticateSession(database, secrets, token) : undefined;
    reply.header("Cache-Control", "no-store");
    return getLeaderboard(database, limit, player?.id);
  });
}
