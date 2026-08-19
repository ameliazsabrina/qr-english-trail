# Bonjotan English Trail

Mobile-first QR learning trail for children exploring Bonjotan. The repository follows the architecture in [PRD.md](./PRD.md): a React client, a server-authoritative API, MongoDB persistence, and version-controlled learning content.

## What is scaffolded

- Mobile-first React/Vite trail UI and stable `/point/:slug` QR routes.
- Fastify API with health, point-list, and public point-detail endpoints.
- Ten active learning points with five multiple-choice questions each.
- Content validation for IDs, slugs, answer configuration, and minimum pool size.
- MongoDB connection and required index bootstrap (enabled when `MONGODB_URI` is set).
- Shared TypeScript contracts and safe local-storage helpers.
- Initial API and content tests.

Player creation/recovery, attempt issuance/submission, atomic scoring, progress, and the live leaderboard are intentionally the next vertical slice. The current API never exposes the question bank or answer keys through its public point endpoints.

## Prerequisites

- Node.js 22+
- pnpm 10+
- MongoDB for persistence work (the content scaffold runs without it)

## Start locally

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Open <http://localhost:5173>. The web dev server proxies `/api` to <http://localhost:3001>.

To connect MongoDB, export `MONGODB_URI` before starting the API. The example configuration uses `mongodb://localhost:27018/bonjotan`. Environment files are ignored by Git; never commit production secrets.

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
apps/api                 Fastify API and MongoDB bootstrap
packages/content         Versioned lessons, questions, schema, validation
packages/shared-types    Contracts shared between web, API, and content
```

## Content workflow

1. Edit `packages/content/src/points.ts`.
2. Keep point, slug, and question IDs stable after QR publication.
3. Increase `contentVersion` when published lesson or question content changes.
4. Run `pnpm validate:content` and request educator review before publishing.

The current text is seed content for product development, not final educator-approved copy.
