import type { FastifyInstance } from "fastify";
import type { Database } from "../db/client.js";
import { answerAttempt, AttemptError, createAttempt } from "../repositories/attempts.js";
import type { AuthSecrets } from "../services/auth.js";
import type { RandomSource } from "../services/content.js";
import { requirePlayer } from "./auth.js";

export function registerAttemptRoutes(app: FastifyInstance, database: Database, secrets: AuthSecrets, random: RandomSource) {
  app.post<{ Params: { slug: string } }>("/api/points/:slug/attempts", async (request, reply) => {
    const player = requirePlayer(request, reply, database, secrets);
    if (!player) return;
    try {
      reply.header("Cache-Control", "no-store");
      return reply.status(201).send({ attempt: createAttempt(database, player.id, request.params.slug, random) });
    } catch (error) {
      if (error instanceof AttemptError) return reply.status(error.statusCode).send({ error: { code: error.code, message: error.message } });
      throw error;
    }
  });

  app.post<{ Params: { attemptId: string }; Body: { questionId?: unknown; optionId?: unknown } }>("/api/attempts/:attemptId/answers", async (request, reply) => {
    const player = requirePlayer(request, reply, database, secrets);
    if (!player) return;
    const { questionId, optionId } = request.body ?? {};
    if (typeof questionId !== "string" || typeof optionId !== "string") {
      return reply.status(400).send({ error: { code: "INVALID_ANSWER", message: "Choose an answer before continuing." } });
    }
    try {
      reply.header("Cache-Control", "no-store");
      return answerAttempt(database, player.id, request.params.attemptId, questionId, optionId);
    } catch (error) {
      if (error instanceof AttemptError) return reply.status(error.statusCode).send({ error: { code: error.code, message: error.message } });
      throw error;
    }
  });
}
