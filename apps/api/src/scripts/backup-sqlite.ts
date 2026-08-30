import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { readEnv } from "../config/env.js";
import { openDatabase } from "../db/client.js";

const target = process.argv.slice(2).find((argument) => argument !== "--");
if (!target) throw new Error("Provide a backup path: pnpm db:backup -- /absolute/path/backup.sqlite");
const resolved = resolve(target);
mkdirSync(dirname(resolved), { recursive: true });
const database = openDatabase(readEnv().SQLITE_PATH);
await database.sqlite.backup(resolved);
const integrity = database.sqlite.prepare("PRAGMA integrity_check").pluck().get();
database.close();
if (integrity !== "ok") throw new Error(`Source integrity check failed: ${String(integrity)}`);
console.info(`SQLite backup completed: ${resolved}`);
