# Flagger backend

The API for Flagger, built with Node.js, Express, TypeScript, Prisma (MySQL), and Redis.

## Getting started

MySQL and Redis must be running (`pnpm services:up` from the repo root). Then:

```bash
cp .env.example .env     # set SESSION_SECRET and SETUP_API_KEY
pnpm db:deploy           # create the tables
pnpm dev                 # http://localhost:4000
```

Full setup steps are in [docs/installation.md](../docs/installation.md).

## Scripts

| Script                              | What it does                                                |
| ----------------------------------- | ----------------------------------------------------------- |
| `pnpm dev`                          | Run with auto-reload                                        |
| `pnpm build` / `pnpm start`         | Compile to `dist/` and run it                               |
| `pnpm typecheck`                    | Type-check without emitting                                 |
| `pnpm lint` / `pnpm lint:fix`       | Run ESLint                                                  |
| `pnpm format` / `pnpm format:check` | Run Prettier                                                |
| `pnpm db:generate`                  | Generate the Prisma Client (also runs on install)           |
| `pnpm db:migrate --name <name>`     | Create and apply a new migration (development)              |
| `pnpm db:deploy`                    | Apply committed migrations (fresh database, CI, production) |
| `pnpm db:seed`                      | Insert default data (safe to repeat)                        |

## Environment

All variables are validated when the server starts, and it exits with a list of problems if any is missing or invalid.

| Variable              | Purpose                                                   |
| --------------------- | --------------------------------------------------------- |
| `NODE_ENV`            | `development`, `test`, or `production`                    |
| `PORT`                | Port the API listens on (default 4000)                    |
| `DATABASE_URL`        | MySQL connection                                          |
| `SHADOW_DATABASE_URL` | Prisma migration shadow database (used by the Prisma CLI) |
| `REDIS_URL`           | Redis connection                                          |
| `SESSION_SECRET`      | Signs session cookies, at least 32 characters             |
| `ALLOWED_ORIGINS`     | Comma-separated frontend origins for CORS                 |
| `SETUP_API_KEY`       | Key for creating the first admin, at least 32 characters  |

Details: [docs/configuration.md](../docs/configuration.md).

## Structure

```
backend/
├── prisma/
│   ├── schema.prisma     # Data model
│   └── migrations/       # Committed SQL migrations
├── prisma.config.ts      # Prisma CLI configuration
└── src/
    ├── api/              # Route handlers, one file or folder per resource
    ├── config/           # Validated environment (import { env } from "@/config")
    ├── db/               # Prisma client, seed, database constants
    ├── errors/           # AppError and error codes
    ├── middleware/       # notFound, errorHandler, validateBody, asyncHandler
    ├── app.ts            # Express app
    ├── router.ts         # Mounts the API routes under /api
    └── server.ts         # Entry point
```

## Endpoints

| Method | Path          | Description                               |
| ------ | ------------- | ----------------------------------------- |
| GET    | `/`           | Basic API info                            |
| GET    | `/api/health` | Health check, returns `{ success, data }` |

Every error response uses the same shape, see [docs/api-errors.md](../docs/api-errors.md).

## Conventions

- Read configuration through `@/config` only, never `process.env` directly (the one exception is `prisma.config.ts`).
- Use `AppError` for errors the client may see, and wrap async route handlers in `asyncHandler`.
- Keep types and constants in a `types.ts` and `constants.ts` next to the code that uses them.
- Migrations are committed and never edited after they are merged, see [docs/database.md](../docs/database.md).
