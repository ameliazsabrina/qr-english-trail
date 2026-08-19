import cors from "@fastify/cors";
import Fastify from "fastify";
import type { AppEnv } from "./config/env.js";
import { getPublicPoint, listActivePoints } from "./services/content.js";

export async function createApp(env: Pick<AppEnv, "WEB_ORIGIN">) {
  const app = Fastify({ logger: process.env.NODE_ENV !== "test" });
  await app.register(cors, { origin: env.WEB_ORIGIN });

  app.get("/api/health", async () => ({ status: "ok" as const }));

  app.get("/api/points", async () => ({ points: listActivePoints() }));

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

