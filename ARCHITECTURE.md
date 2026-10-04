# Flagger: Architecture

Flagger is a full-stack feature flag system (backend + frontend) with extra features built to showcase engineering skill: granular permissions, admin and normal users, a rule engine, a diagnosis service, structured logging, and multi-eye approval flows.

## Planned features

- Granular permissions (Epic 4: roles and access scoping)
- Admin and normal user areas
- Rule engine (flag targeting and evaluation rules)
- Diagnosis service (built, see `docs/diagnosis.md`)
- Structured logging (built, see `docs/logging.md`)
- Approval flow with multi-eye (multiple approver) sign-off

## Stack

- Monorepo: pnpm workspace (`backend/`, `frontend/`, `docs/`)
- Backend: Express + TypeScript, Prisma + MySQL, Redis sessions (`connect-redis` + `redis` client; not `ioredis`), pino for logging
- Frontend: Next.js App Router, Tailwind, light/dark theme tokens, react-hook-form + zod

## Backend structure

- `src/api/v1/<resource>/`: `.router`, `.controller`, `.service`, `.instrumented`, `.validator`, `.types`, `.constants`, `.utils`, exported via `index.ts`. The controller imports the service from `.instrumented`, which wraps it for path logging.
- `src/repositories/<model>/`: all data access (Prisma lives here)
- `src/lib/`: cross-cutting code: `auth` (`requireAuth`, `requireAdmin`), `session`, `errors` (AppError), `audit` (writer plus the outage fallback), `diagnosis` (system health state, scheduler, guard), `logger` (pino logger, request context, `instrument`, redaction)
- `src/middleware/`: `request-logger`, `async-handler` (logs controller enter/exit), `validate` (`validateBody`, `validateParams`, `validateQuery`), `error-handler` (the one place errors are logged and sent; maps Prisma `P2002` to 409), `not-found`
- `src/config/`: env (including the log settings), db, redis
- Models: `User`, `SystemSetting`, `AuditLog`, `Environment`, `Project`, `Entity` (`prisma/schema.prisma`)
- `src/generated/prisma/` is auto-generated. Never edit or read it.

## Frontend structure

- `app/`: routes and layouts only (`/admin/*` is guarded; the admin layout also sets page padding and max width)
- `feature/<name>/`: domain logic + components (`.service`, `.hook`, `.validator`, `.types`, `.constants`, `components/`, exported via `index.ts`)
- `feature/diagnosis/` + `shared/lib/diagnosis/`: `DiagnosisGate` wraps the app shell. The store is in `shared/lib` because `api.ts` flips it.
- `shared/components/{ui,layout,form,feedback}/`: reusable primitives (Button, Field, Modal, Popover, Avatar, Badge, ConfirmDialog, Toast, Loader, Sidebar)
- `shared/components/layout/resource-list/`: the admin list kit. `ResourceList` (header, loading/error/empty states), `ResourceToolbar` (show-deleted toggle, plus `search` and `filters` slots) and `ResourceRow` (card row, stacks on mobile).
- `shared/{lib,hooks,config,theme}/`: API client, `api-query.hook` (read on mount), `use-action.hook` (one-off mutations: busy state, error toast, optional success toast, then refetch), env, theming
- App shell: sidebar + scrollable main. No navbar or footer.

### Admin routes

- `/admin/environments`: list, create, edit, delete, restore, reorder
- `/admin/projects`: list, create, edit, delete, restore
- `/admin/projects/[id]`: the project's entities (list, create, edit, delete, restore)
- Users, Audit and the dashboard are still placeholders.

## Key decisions

- **Session auth, not JWT.** Sessions live server-side in Redis. The client cookie holds only `userId` + `sessionVersion`. Bumping `sessionVersion` on password change logs out all other sessions (intentional).
- **Modals over pages** for login, forced password change, profile, settings, and the create/edit forms of the catalog screens. Keeps one persistent shell and avoids route-guard sprawl.
- **Features don't import each other.** Duplicate tiny constants instead (documented inline where done). The frontend catalog validators duplicate the backend limits and key pattern for the same reason.
- **Every auth action is audit-logged** via `lib/audit`.
- First-admin setup is one-time and key-gated.
- **Catalog keys are immutable and stay reserved.** `Environment`, `Project` and `Entity` keys can't change after creation, and the unique index covers soft-deleted rows, so a deleted key can only come back through restore. Entity keys are unique per project, and `project_id` is immutable too.
- **Entities are nested** under their project (`/projects/:projectId/entities`). Every entity route needs an active parent project (404 otherwise). Soft-deleting a project does not cascade to its entities. In the UI, entities are managed on the project's page, not as a top-level admin screen.
- **Catalog list endpoints are admin-only for now.** R6 (non-admins see only what they can access) waits for Epic 4. Each service has a documented hook where the access filter goes, and only the GET guard gets relaxed.
- **Audit rows carry scope ids**: `project.*` sets `projectId`, `entity.*` sets `projectId` and `entityId`, `environment.*` sets `environmentId`. Environment reorder writes one `environment.updated` row per environment that moved.
- **Diagnosis owns system health, the scheduler owns recovery, the frontend only reflects it.** The system boots `DOWN` and any critical error marks it `DOWN` at once. Only one fully clean scheduler cycle moves it back to `UP`; a successful request never does. While `DOWN`, the guard returns 503 and `guardedJob` skips background work.
- **Status is per instance, in memory.** A Redis-backed status would be unreadable when Redis is down.
- **Audit events that must survive an outage use `recordAuditEvent`** (DB, then a Redis list, then a local spool file) and are replayed after recovery. Each carries a unique `eventId` and its original timestamp. Every fallback and replay is logged.
- **The server starts with dependencies down.** DB and Redis connect in the background, and a failed connect is logged (`db.connect.failed`, `redis.connect.failed`), not fatal.
- **Environment order** is set with `PUT /environments/order`, which takes every active id exactly once and returns the full active list. The UI uses up/down buttons (no drag-and-drop dependency, works on mobile and by keyboard).
- **Form errors:** invalid input shows inline per field (client zod schema mirrors the server). A `CONFLICT` response is shown on the key field. Any other failure is a form-level `FormError` banner. Delete, restore and reorder failures are toasts via `useAction`.
- **App logs are separate from the audit log.** Audit answers who changed what (DB, permanent). The logger answers what the system did, in order (JSON to stdout in production, pretty console in dev, no log file). The logger imports only `config/env`, so it keeps working when the DB and Redis are down.
- **One log shape for every line:** `level, time, service, env, scope, event, msg, requestId, traceId, meta, data, err`. `event` is a fixed dotted name for filtering, `msg` is the readable sentence, `meta` holds `userId`, `sessionVersion` and `userType`, and `data` holds the event values (primitives and arrays of primitives only). Absent fields are omitted, never `null`.
- **Log everything, structured, always on.** Request start/finish/aborted and service start/end are `info`, controller enter/exit are `debug`, SQL text is `trace`. Slow queries are `warn` and `error` at `LOG_SLOW_QUERY_WARN_MS` and `LOG_SLOW_QUERY_ERROR_MS`. Each request ends with a summary in `request.finish` (`queryCount`, `dbTimeMs`, `services`).
- **Log events, never values.** Never log passwords, hashes, cookies, session ids, tokens, the setup key, request or response bodies, SQL params or emails. Redaction is central (`lib/logger/redact.ts`), and errors are reduced to type, message, code and stack frames (Prisma messages are replaced by their code).
- **Each failure is logged once, at the boundary.** The error handler logs `request.error`. Services and controllers throw and do not log errors. Services log only decision snapshots (ids, booleans, counts) at branches that change the outcome, and `error` for invariant violations. Auth denials log their reason with `meta.userId`.
- **`requestId` ties everything together.** It is the same id in log lines, `audit_logs.request_id`, the `x-request-id` header and the `requestId` field of every error body. A client-supplied id is accepted only if it matches `^[A-Za-z0-9_-]{8,36}$`, and `x-trace-id` only if it matches `^[A-Za-z0-9_-]{8,64}$`. Health cycles and `guardedJob` runs get their own `traceId` and no `requestId`.
- **Production logging is stdout only, synchronous JSON, no transport.** The platform's collector owns retention (target: 30 days, admin-only read) and the app cannot rewrite it.

## Gotchas

- Tailwind classes must be written literally. Dynamic class-string construction is silently dropped by the static scanner.
- Prisma exports model types as `<Model>Model` (e.g. `UserModel`), not the bare name.
- Flex children that truncate need `min-w-0` (this caused the Sidebar and Button overflow bugs).
- Nested routers need `Router({ mergeParams: true })`, or `:projectId` from the parent mount is invisible to validators and controllers.
- `validateParams` only checks values. It doesn't replace `req.params`, so controllers still convert with `Number(req.params.id)`.
- Server validation errors come back as one joined string (`"field: message; ..."`), not per field, so the frontend can't map them to fields. Keep the client schemas in sync with the backend ones. The log line `request.validation.failed` does carry the rejected field names.
- There is no `GET /projects/:id`. The project page finds its project in the full list (deleted included).
- A restored environment keeps its old `sortOrder` and can land mid-list or tie with another. The next reorder normalizes the values.
- `useApiQuery` needs a stable `request` reference, so wrap parameterized service calls in `useCallback` (see `useEnvironments`).
- Mount order in `app.ts`: `requestId`, `requestLogger`, `cors`, `diagnosisGuard`, `json`, session. A new public or infra route that must work while `DOWN` goes in `GUARD_EXEMPT_PATHS`, which also skips the session middleware.
- `diagnosis.recordCycleResult` is for the scheduler only. Never call it from request code.
- Wrap every new background job or scheduled action in `guardedJob`. It also gives the run its own `traceId` for logs.
- Replayed audit rows keep their original `created_at`, so `id` order is not time order. Sort audit views by `created_at`.
- Inside `lib/diagnosis` and `lib/audit`, import from `@/lib/errors` and `@/lib/logger`, not the `@/lib` barrel, to avoid a circular import.
- `console` is a lint error in the backend. Only the env boot error (`config/env/env.ts`) and `config/db/seed.ts` are exempt. Use `getLogger(scope)`.
- A new log scope must be added to `LOG_SCOPES` in `config/env/log.constants.ts`. Setting `LOG_SCOPES` in `.env` limits every scope that is not listed to `warn` and above.
- `data` accepts primitives and arrays of primitives only. Never pass user strings, bodies or objects.
- `instrument` wraps the exported functions of a service module and logs only top-level number and boolean arguments. Helpers inside a service file are not wrapped, so give them a decision snapshot line if they matter.
- `asyncHandler` takes async handlers only, so a synchronous handler such as `getMe` stays outside it and has no controller lines.
- Middleware that runs before the error handler (`asyncHandler`, `validate*`, `requireAuth`, `requireSetupKey`) calls `recordRoute`. Express resets `baseUrl` before the error handler runs, so without it error lines show a partial route.
- While `DOWN`, the guard marks its 503s and `request.finish` logs them at `warn`, so an outage doesn't create an error line per request.
- `TRUST_PROXY_HOPS` must match the real number of proxies in production. A wrong value lets clients spoof `req.ip` through `x-forwarded-for`.
- A lost audit event (DB, Redis and spool all failed) logs only `action` and `auditEventId`, never the payload, because audit metadata can hold an attempted email.
- MySQL 8.4 auth cache: after a container restart the pool only reconnects with `allowPublicKeyRetrieval=true` (dev) or TLS (prod). See `docs/troubleshooting.md`.

## Current state

- Done: auth (setup, login, logout, `requireAuth`/`requireAdmin`, forced password change), audit logging, health check (DB + Redis), diagnosis service (backend core, wiring, audit fallback, frontend gate, manual test matrix), backend logging (see `docs/logging.md`), shared UI kit, app shell, account menu, profile modal (untested)
- Logging: logger core, request context, controller and service path logging, DB and Redis logging, boundary logging for errors, validation and auth, diagnosis, audit fallback and process logging, and the `no-console` lint rule. Error responses carry `requestId`, but the frontend does not show it yet, and there is no frontend error reporting.
- Catalog (backend): environments, projects and entities have admin CRUD with soft delete, restore and audit logging. Environments also support reorder. The seed creates `dev`, `staging` and `production`. R6 is not implemented yet.
- Catalog (frontend): admin screens for environments, projects and entities (see Admin routes), built on the shared `resource-list` kit. The toolbar only has "Show deleted" so far; search and filters are not built.
- Admin area: Users, Audit and the dashboard are placeholders.
- Needs verification: Button and Sidebar overflow fixes, Profile modal (long names, mobile widths, change-password-from-profile flow), catalog screens at mobile widths, and that the sidebar highlights Projects on `/admin/projects/[id]`

## Next

1. Verify the overflow fixes, Profile modal and catalog screens
2. Search and filters in the resource toolbar (client-side first, since the lists are small)
3. Epic 4 (roles/access scoping), then R6 on the three list endpoints
4. Show `requestId` in frontend error toasts, and later add frontend error reporting

## New resource checklist

Prisma model + migration, repository, `api/v1/<resource>/` module, register in `api/v1/index.ts` (nested resources: mount under the parent router, with `Router({ mergeParams: true })`), audit calls, a scope in `LOG_SCOPES`, `<resource>.instrumented.ts` wrapping the service (the controller imports from it), decision snapshot lines at outcome-changing branches, then `feature/<resource>/` on the frontend (build the list on `ResourceList` / `ResourceRow`) and the matching `app/admin/<resource>/page.tsx`.
