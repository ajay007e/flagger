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

| Variable                  | Purpose                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| `NODE_ENV`                | `development`, `test`, or `production`                                                      |
| `PORT`                    | Port the API listens on (default 4000)                                                      |
| `DATABASE_URL`            | MySQL connection                                                                            |
| `SHADOW_DATABASE_URL`     | Prisma migration shadow database (used by the Prisma CLI)                                   |
| `REDIS_URL`               | Redis connection                                                                            |
| `SESSION_SECRET`          | Signs session cookies, at least 32 characters                                               |
| `ALLOWED_ORIGINS`         | Comma-separated frontend origins for CORS                                                   |
| `SETUP_API_KEY`           | Key for creating the first admin, at least 32 characters                                    |
| `AUDIT_SPOOL_PATH`        | Optional. Local audit fallback file (default `var/audit-spool.jsonl`)                       |
| `LOG_LEVEL`               | Optional. `trace` to `fatal`, or `silent` (default `info` in production, `debug` otherwise) |
| `LOG_SCOPES`              | Optional. Comma-separated log scopes to show in full, others log `warn` and above           |
| `LOG_SYNC`                | Optional. `true` (default) or `false`. Production only                                      |
| `LOG_SLOW_QUERY_WARN_MS`  | Optional. Slow query warning threshold in ms (default 500)                                  |
| `LOG_SLOW_QUERY_ERROR_MS` | Optional. Slow query error threshold in ms (default 2000), must exceed the warn threshold   |
| `TRUST_PROXY_HOPS`        | Optional. Number of reverse proxies in front (default 1 in production, 0 otherwise)         |

Details: [docs/configuration.md](../docs/configuration.md).

Session behavior (cookies, Redis, CORS) is documented in [docs/sessions.md](../docs/sessions.md).

## Structure

```
backend/
├── prisma/
│   ├── schema.prisma     # Data model
│   └── migrations/       # Committed SQL migrations
├── prisma.config.ts      # Prisma CLI configuration
└── src/
    ├── api/v1/           # One folder per resource: router, controller, service, instrumented service, validator
    ├── config/           # Environment, database, and Redis
    │   ├── env/          # Validated environment (import { env } from "@/config")
    │   ├── db/           # Prisma client, seed, database constants
    │   └── redis/        # Redis client
    ├── lib/              # Cross-cutting building blocks
    │   ├── audit/        # Append-only audit log: writer, sanitizer, request id, outage fallback
    │   ├── auth/         # requireAuth, requireAdmin, getCurrentUser
    │   ├── diagnosis/    # System health (UP/DOWN), scheduler, guard, job wrapper
    │   ├── errors/       # AppError and error codes
    │   ├── logger/       # pino logger, request context, service instrumentation, redaction
    │   └── session/      # express-session + Redis store configuration
    ├── middleware/       # requestLogger, notFound, errorHandler, validate*, asyncHandler
    ├── repositories/     # All data access (Prisma lives here)
    ├── app.ts            # Express app
    ├── router.ts         # Mounts the API routes under /api
    └── server.ts         # Entry point
```

## Endpoints

All paths are under `/api/v1`, except `GET /`.

| Method | Path                                        | Access    | Description                                                                    |
| ------ | ------------------------------------------- | --------- | ------------------------------------------------------------------------------ |
| GET    | `/` (no prefix)                             | Public    | Basic API info                                                                 |
| GET    | `/health`                                   | Public    | Health check: overall status plus MySQL and Redis status                       |
| GET    | `/diagnosis`                                | Public    | System status (`UP`/`DOWN`). While `DOWN`, every other route returns 503       |
| POST   | `/auth/setup-admin`                         | Setup key | Create the first admin (header `x-setup-key`). 404 once an admin exists        |
| POST   | `/auth/login`                               | Public    | Log in with email and password, starts a session                               |
| GET    | `/auth/me`                                  | Session   | Current user. Works while `mustChangePassword` is true                         |
| POST   | `/auth/change-password`                     | Session   | Change your own password. Works while `mustChangePassword` is true             |
| POST   | `/auth/logout`                              | Public    | Ends the current session. Succeeds even with none                              |
| GET    | `/environments`                             | Admin     | List environments in order. `?includeDeleted=` adds deleted ones               |
| POST   | `/environments`                             | Admin     | Create an environment (201)                                                    |
| PUT    | `/environments/order`                       | Admin     | Reorder. Body lists every active id exactly once. Returns the full active list |
| PATCH  | `/environments/:id`                         | Admin     | Update name or description. The key is immutable                               |
| DELETE | `/environments/:id`                         | Admin     | Soft delete                                                                    |
| POST   | `/environments/:id/restore`                 | Admin     | Restore a soft-deleted environment                                             |
| GET    | `/projects`                                 | Admin     | List projects. `?includeDeleted=` adds deleted ones                            |
| POST   | `/projects`                                 | Admin     | Create a project (201)                                                         |
| PATCH  | `/projects/:id`                             | Admin     | Update name or description. The key is immutable                               |
| DELETE | `/projects/:id`                             | Admin     | Soft delete. Its entities are not deleted with it                              |
| POST   | `/projects/:id/restore`                     | Admin     | Restore a soft-deleted project                                                 |
| GET    | `/projects/:projectId/entities`             | Admin     | List the project's entities. `?includeDeleted=` adds deleted ones              |
| POST   | `/projects/:projectId/entities`             | Admin     | Create an entity (201). Keys are unique per project                            |
| PATCH  | `/projects/:projectId/entities/:id`         | Admin     | Update name or description. The key and project are immutable                  |
| DELETE | `/projects/:projectId/entities/:id`         | Admin     | Soft delete                                                                    |
| POST   | `/projects/:projectId/entities/:id/restore` | Admin     | Restore a soft-deleted entity                                                  |

Rules that apply across the catalog routes:

- Keys (environment, project, entity) cannot change after creation and stay reserved after a delete. Creating a reserved key returns 409, and the only way back is restore.
- Every entity route needs an active parent project, otherwise it returns 404.
- Every write is audit-logged.
- Success is 201 for creates and 200 for everything else. Common errors: 400 (validation), 401 (no or expired session), 403 (not an admin, or a forced password change is pending), 404, 409 and 503 (system `DOWN`).

Every error response uses the same shape, including the `requestId` of the request, see [docs/api-errors.md](../docs/api-errors.md).

## First admin

Create the first admin with the setup key from `SETUP_API_KEY` in `backend/.env`. The endpoint works only while no active admin exists; afterwards it returns 404.

```bash
curl -X POST http://localhost:4000/api/v1/auth/setup-admin \
  -H "Content-Type: application/json" \
  -H "x-setup-key: <your SETUP_API_KEY>" \
  -d '{"email": "admin@example.com", "name": "Admin", "password": "a-strong-password"}'
```

Diagnosis (how the system blocks itself and recovers) is documented in [docs/diagnosis.md](../docs/diagnosis.md).

Every meaningful action is recorded in an append-only audit log, see [docs/audit.md](../docs/audit.md).

## Logging

The backend writes structured JSON logs with pino: pretty console in development, one JSON line per event on stdout in production. Every line from a request shares its `requestId`, which is also the `x-request-id` response header, the `requestId` in error responses and the `request_id` of its audit rows. Secrets, bodies, SQL parameters and emails are never logged. See [docs/logging.md](../docs/logging.md).

## Conventions

- Read configuration through `@/config` only, never `process.env` directly (the one exception is `prisma.config.ts`).
- Use `AppError` for errors the client may see, and wrap async route handlers in `asyncHandler`.
- Keep types and constants in a `types.ts` and `constants.ts` next to the code that uses them.
- Migrations are committed and never edited after they are merged, see [docs/database.md](../docs/database.md).
- Log through `getLogger(scope)` from `@/lib/logger`. `console` is a lint error (the env boot error and the seed script are the only exceptions). Log ids and booleans, never user strings, bodies or emails.
- Throw errors, do not log them. The error handler logs each failure once.
- A new resource gets a scope in `LOG_SCOPES` and a `<resource>.instrumented.ts` that wraps its service. The controller imports the service from there.
