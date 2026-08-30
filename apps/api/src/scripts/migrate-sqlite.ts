import { readEnv } from "../config/env.js";
import { openDatabase } from "../db/client.js";

const env = readEnv();
const database = openDatabase(env.SQLITE_PATH);
database.close();
console.info(`SQLite migrations are current: ${env.SQLITE_PATH}`);
