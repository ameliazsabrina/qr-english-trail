import type { FastifyInstance } from "fastify";
import type { Database } from "../db/client.js";
import { getProgress } from "../repositories/progress.js";
import type { AuthSecrets } from "../services/auth.js";
import { requirePlayer } from "./auth.js";

export function registerProgressRoutes(app: FastifyInstance, database: Database, secrets: AuthSecrets) {
  app.get("/api/progress", async (request, reply) => {
    const player = requirePlayer(request, reply, database, secrets);
    if (!player) return;
    reply.header("Cache-Control", "no-store");
    return { progress: getProgress(database, player.id) };
  });
}
