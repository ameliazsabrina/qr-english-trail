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

## VPS deployment with Docker Compose

The production stack runs the static web app behind Nginx and proxies `/api` to a
single Fastify container. SQLite is kept in the named `bonjotan-data` volume, and
the API applies pending migrations before it starts.

```bash
cp .env.example .env
# Set WEB_ORIGIN to the public https:// URL and replace both peppers with
# different random values of at least 32 characters.
docker compose build
docker compose up -d
docker compose ps
```

The web service binds to `127.0.0.1:8081` by default so only a host-level reverse
proxy such as Caddy can reach it. Terminate TLS at that reverse proxy, and back up
the `bonjotan-data` volume regularly. Only one API replica may write to this local
SQLite database.

### Automatic production deployment

After the verification and Docker build jobs pass on `main`, GitHub Actions uses
SSH to fast-forward the VPS checkout and rebuild the Compose services. Configure
these GitHub repository **Variables** under Settings → Secrets and variables →
Actions:

- `VPS_HOST` — VPS IP address or SSH hostname
- `VPS_USER` — dedicated deployment user
- `VPS_SSH_PORT` — SSH port, normally `22`
- `VPS_APP_PATH` — absolute path to the repository on the VPS

Configure these repository **Secrets**:

- `VPS_SSH_PRIVATE_KEY` — private key authorized for the deployment user
- `VPS_KNOWN_HOSTS` — pinned SSH host-key entry for the VPS

The VPS keeps its production `.env` locally; it is ignored by Git and is not sent
through GitHub Actions.

## Workspace map

```text
apps/web                 React mobile web application
apps/api                 Fastify API, Drizzle schema, and SQLite migrations
packages/content         Versioned lessons, questions, and validation
packages/shared-types    Contracts shared by the web, API, and content
```

Each eligible first completion asks five questions, awards 100 points per correct answer and a 20-point completion bonus, and can contribute at most 520 points. Replays are Practice Mode and award zero. Across ten points, the maximum score is 5,200.
