import cors from "@fastify/cors";
import Fastify from "fastify";
import type { AppEnv } from "./config/env.js";
import { openDatabase, type Database } from "./db/client.js";
import { registerAttemptRoutes } from "./routes/attempts.js";
import { registerLeaderboardRoutes } from "./routes/leaderboard.js";
import { registerPlayerRoutes } from "./routes/players.js";
import { registerProgressRoutes } from "./routes/progress.js";
import type { AuthSecrets } from "./services/auth.js";
import { getPointQuiz, getPublicPoint, listActivePoints, type RandomSource } from "./services/content.js";

type AppConfig = Pick<AppEnv, "WEB_ORIGIN"> & Partial<Pick<AppEnv, "SESSION_TOKEN_PEPPER" | "RECOVERY_CODE_PEPPER" | "SESSION_LIFETIME_DAYS">>;

export async function createApp(env: AppConfig, random: RandomSource = Math.random, providedDatabase?: Database) {
  const app = Fastify({ logger: process.env.NODE_ENV !== "test" });
  const database = providedDatabase ?? openDatabase(":memory:");
  const secrets: AuthSecrets = {
    sessionPepper: env.SESSION_TOKEN_PEPPER ?? "development-session-pepper",
    recoveryPepper: env.RECOVERY_CODE_PEPPER ?? "development-recovery-pepper",
    sessionLifetimeDays: env.SESSION_LIFETIME_DAYS ?? 90,
  };
  await app.register(cors, { origin: env.WEB_ORIGIN });

  app.get("/api/health", async () => {
    database.sqlite.prepare("SELECT 1").get();
    return { status: "ok" as const };
  });

  registerPlayerRoutes(app, database, secrets);
  registerAttemptRoutes(app, database, secrets, random);
  registerProgressRoutes(app, database, secrets);
  registerLeaderboardRoutes(app, database, secrets);

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

  app.get<{ Params: { slug: string } }>("/api/points/:slug/quiz", async (request, reply) => {
    const questions = getPointQuiz(request.params.slug, random);
    if (!questions) {
      return reply.status(404).send({
        error: { code: "POINT_NOT_FOUND", message: "We could not find that English Point." }
      });
    }
    reply.header("Cache-Control", "no-store");
    return { questions };
  });

  app.setNotFoundHandler((_request, reply) => reply.status(404).send({
    error: { code: "NOT_FOUND", message: "That page does not exist." }
  }));

  if (!providedDatabase) app.addHook("onClose", async () => database.close());

  return app;
}
