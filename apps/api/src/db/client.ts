import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import BetterSqlite3 from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

export type Database = {
  sqlite: BetterSqlite3.Database;
  orm: BetterSQLite3Database<typeof schema>;
  close: () => void;
};

export function openDatabase(path: string, migrate = true): Database {
  if (path !== ":memory:") mkdirSync(dirname(resolve(path)), { recursive: true });
  const sqlite = new BetterSqlite3(path);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("synchronous = NORMAL");
  if (migrate) runMigrations(sqlite);
  return { sqlite, orm: drizzle(sqlite, { schema }), close: () => sqlite.close() };
}

export function runMigrations(sqlite: BetterSqlite3.Database): void {
  sqlite.exec("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)");
  const name = "0000_initial.sql";
  const exists = sqlite.prepare("SELECT 1 FROM _migrations WHERE name = ?").get(name);
  if (exists) return;
  const migrationUrl = new URL(`./migrations/${name}`, import.meta.url);
  const sql = readFileSync(migrationUrl, "utf8");
  sqlite.transaction(() => {
    sqlite.exec(sql);
    sqlite.prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)").run(name, Date.now());
  })();
}

export function assertMigrationsCurrent(sqlite: BetterSqlite3.Database): void {
  const migrationTable = sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '_migrations'").get();
  const initial = migrationTable ? sqlite.prepare("SELECT 1 FROM _migrations WHERE name = '0000_initial.sql'").get() : undefined;
  if (!initial) throw new Error("SQLite migrations are not current. Run pnpm db:migrate before starting the API.");
}
