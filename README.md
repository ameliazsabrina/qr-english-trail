# Bonjotan English Trail

Mobile-first QR learning trail for children exploring Bonjotan. The React client stores only an opaque session token; the Fastify API and SQLite database are authoritative for identity, attempts, scoring, progress, recovery, and rankings.

## Prerequisites

- Node.js 24.2.x (run `nvm use` in this repository)
- pnpm 10+
- A persistent writable directory for SQLite in production

## Local development

```bash
cp .env.example .env
nvm use
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`better-sqlite3` is a native dependency. If you change Node versions, run `pnpm rebuild better-sqlite3` before running database commands.

Open <http://localhost:5173>. The web development server proxies `/api` to <http://localhost:3001>. The default database is `./data/bonjotan.sqlite`; set strong, distinct session and recovery peppers outside source control in production.

## Database commands

```bash
pnpm db:generate  # generate Drizzle migrations after a schema change
pnpm db:migrate   # apply versioned SQLite migrations
pnpm db:seed      # repeatable non-production demo data
pnpm db:studio    # inspect local data with Drizzle Studio
```

Migrations are explicit deployment work and should run before the API starts. SQLite uses foreign keys, WAL, a 5-second busy timeout, and normal synchronous mode. Run exactly one API replica against a local database file.

## Backup and restore

Keep the database, `-wal`, and `-shm` files on a persistent volume. For an online backup, use SQLite's backup API or run `VACUUM INTO '/backups/bonjotan-YYYYMMDD.sqlite'` against the live database. Verify a backup with `PRAGMA integrity_check`, then test restoration by starting the same application version against a copy and checking `/api/health` and `/api/leaderboard`.

The included online-backup command is:

```bash
pnpm db:backup -- /absolute/path/bonjotan-backup.sqlite
```

Before restoring, stop the API, retain the current database as a rollback copy, place the verified restored file at `SQLITE_PATH`, apply migrations, and restart. Monitor database-open errors, busy timeouts, scoring transaction failures, disk space, and recovery rate-limit events; never log bearer tokens, recovery codes, or their hashes.

## Quality commands

```bash
pnpm validate:content
pnpm typecheck
pnpm test
pnpm build
```

## Workspace map

```text
apps/web                 React mobile web application
apps/api                 Fastify API, Drizzle schema, and SQLite migrations
packages/content         Versioned lessons, questions, and validation
packages/shared-types    Contracts shared by the web, API, and content
```

Each eligible first completion asks five questions, awards 100 points per correct answer and a 20-point completion bonus, and can contribute at most 520 points. Replays are Practice Mode and award zero. Across ten points, the maximum score is 5,200.
