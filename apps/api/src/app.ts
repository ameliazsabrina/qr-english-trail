import cors from "@fastify/cors";
import Fastify from "fastify";
import type { AppEnv } from "./config/env.js";
import { checkQuizAnswer, getPublicPoint, getQuizQuestions, listActivePoints } from "./services/content.js";

export async function createApp(env: Pick<AppEnv, "WEB_ORIGIN">) {
  const app = Fastify({ logger: process.env.NODE_ENV !== "test" });
  await app.register(cors, { origin: env.WEB_ORIGIN });

  app.get("/api/health", async () => ({ status: "ok" as const }));

  app.get("/api/points", async () => ({ points: listActivePoints() }));

  app.get("/api/quiz", async () => ({ questions: getQuizQuestions() }));

  app.post<{ Body: { questionId?: string; optionId?: string } }>("/api/quiz/check", async (request, reply) => {
    const { questionId, optionId } = request.body ?? {};
    if (!questionId || !optionId) {
      return reply.status(400).send({
        error: { code: "INVALID_ANSWER", message: "Choose an answer before continuing." }
      });
    }
    const result = checkQuizAnswer(questionId, optionId);
    if (!result) {
      return reply.status(404).send({
        error: { code: "QUESTION_NOT_FOUND", message: "That question is no longer available." }
      });
    }
    return { result };
  });

  app.get<{ Params: { slug: string } }>("/api/points/:slug", async (request, reply) => {
    const point = getPublicPoint(request.params.slug);
    if (!point) {
      return reply.status(404).send({
        error: { code: "POINT_NOT_FOUND", message: "We could not find that English Point." }
      });
    }
    return { point };
  });

  app.setNotFoundHandler((_request, reply) => reply.status(404).send({
    error: { code: "NOT_FOUND", message: "That page does not exist." }
  }));

  return app;
}
