# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Start dev server with hot reload (tsx watch)
npm run build            # TypeScript compilation (tsc)
npm start                # Run compiled output (node dist/server.js)

# Database
npm run prisma:generate  # Generate Prisma client after schema changes
npm run prisma:migrate   # Run database migrations (prisma migrate dev)
npm run db:seed          # Seed database with sample data (tsx prisma/seed.ts)

# Infrastructure
docker compose up -d     # Start PostgreSQL 16 container
```

No test runner or linter is currently configured.

## Architecture

**Stack**: Fastify + Prisma + TypeScript (ES modules), PostgreSQL, Zod validation, JWT auth (argon2 passwords).

### Module Pattern

Each feature lives in `src/modules/<feature>/` with a consistent structure:

- **routes.ts** — Fastify route definitions with Zod schema bindings
- **schemas.ts** — Zod schemas for request/response validation
- **service.ts** — Business logic as a factory function receiving `FastifyInstance`
- **shapes.ts** — (optional) Transform DB models to API response shapes

Services use a factory pattern: `export function postsService(app: FastifyInstance)` which accesses `app.prisma` for database operations.

### Plugins (`src/plugins/`)

Fastify plugins registered in `src/server.ts`: Prisma client (`prisma.ts`), JWT auth (`auth.ts`), CORS (`cors.ts`), rate limiting (`rateLimit.ts` — 100 req/min).

Protected routes use `preHandler: [app.authenticate]` to require JWT.

### Key Conventions

- **Cursor-based pagination** (not offset) via `src/utils/pagination.ts` — default 20, max 100
- **Path aliases**: `@/*` maps to `src/*` (configured in tsconfig.json)
- **Environment config**: `src/config/env.ts` reads from `.env` (see `.env.example`)
- **Prisma singleton**: `src/utils/prisma.ts` provides shared client instance
- JWT tokens: 15min access, 7d refresh
