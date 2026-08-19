import { createApp } from "./app.js";
import { readEnv } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./repositories/mongo.js";

const env = readEnv();
const app = await createApp(env);

if (env.MONGODB_URI) {
  await connectDatabase(env.MONGODB_URI);
  app.log.info("Connected to MongoDB");
} else {
  app.log.warn("MONGODB_URI is not set; persistence routes are not enabled yet");
}

app.addHook("onClose", disconnectDatabase);

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

