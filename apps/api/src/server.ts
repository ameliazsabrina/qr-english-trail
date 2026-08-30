import { createApp } from "./app.js";
import { readEnv } from "./config/env.js";
import { assertMigrationsCurrent, openDatabase } from "./db/client.js";

const env = readEnv();
const database = openDatabase(env.SQLITE_PATH, false);
assertMigrationsCurrent(database.sqlite);
const app = await createApp(env, Math.random, database);
app.log.info({ path: env.SQLITE_PATH }, "SQLite database ready");
app.addHook("onClose", async () => database.close());

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
