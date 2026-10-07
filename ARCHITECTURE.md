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
- `src/lib/`: cross-cutting code: `auth` (`requireAuth`, `requireAdmin`), `session`, `errors` (AppError), `audit` (writer plus the outage fallback), `diagnosis` (system health state, scheduler, guard), `logger` (pino logger, request context, `instrument`, redaction), `permissions` (the fixed permission list and its helpers), `authorization` (access rules, `secureRouter`, `authorize`, the grant resolver, the scope helpers that turn grants into list filters, and the 404-or-403 visibility check), `pagination` (page/limit query schema, `getSkipTake`, `toPaginatedData`, the `PaginatedData` types)
- `src/middleware/`: `request-logger`, `async-handler` (logs controller enter/exit), `validate` (`validateBody`, `validateParams`, `validateQuery`), `error-handler` (the one place errors are logged and sent; maps Prisma `P2002` to 409), `not-found`
- `src/config/`: env (including the log settings), db, redis
- `src/generated/prisma/` is auto-generated. Never edit or read it.
- Models: `User`, `SystemSetting`, `AuditLog`, `Environment`, `Project`, `Entity`, `Role`, `RolePermission`, `UserAccess` (`prisma/schema.prisma`)

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
- **Catalog reads are scoped, catalog writes are admin-only.** The three list endpoints, `GET /projects/:id` and `GET /access/available` use the `scoped` rule: any authenticated user passes, and the service turns the user's grants into a database filter (`resolveScope`, `resolveEntityScope`, `toIdFilter`), so unpermitted rows never leave the database and pages and counts stay correct. Admins get no filter. Non-admins never see deleted rows, whatever `includeDeleted` says.
- **List endpoints use shared pagination.** `lib/pagination` provides `paginationQuerySchema` (`page` from 1, `limit` default 20, max 100). A list extends it for its own filters, then the service uses `getSkipTake` and `toPaginatedData`, and the response is `{ items, meta }` (`PaginatedData`). The repository runs `findMany` and `count` with the same `where`. Users, projects and entities are paginated. Environments are not, because `PUT /environments/order` and the UI need every id.
- **Permissions live in code, roles live in the DB.** `lib/permissions` is the single list (`flag:read|create|update|delete|approve`, `audit:read`). `role_permissions.permission` is a validated string, not a DB enum, so a new permission needs no migration. Every write to it goes through `assertPermissions`. Admin is a user type that bypasses all checks, not a permission.
- **Any `flag:*` permission implies `flag:read`.** This is computed by `withImpliedPermissions` when permissions are resolved and never stored, so seeded roles keep exactly the permissions they were given. `flag:update` means proposing a change, `flag:approve` means approving one.
- **Every route declares its access rule, and no declaration means denied.** Routes are registered through `secureRouter()` (`lib/authorization`), whose `get`, `post`, `put`, `patch` and `delete` take the rule right after the path: `adminOnly`, `adminOnlyOn(target)`, `adminOnlyHidden`, `scoped` or `requires(permission, target?)`. Leaving it out is a type error, and a missing rule at runtime returns 403 and logs `authorization.undeclared`. `secureRouter` also mounts `requireAuth()`. Public and infra routers (`auth`, `health`, `diagnosis`) use a plain `Router`.
- **One function decides.** `isAllowed` (`lib/authorization/resolver.ts`) allows an action if some grant has the permission through its role (with `withImpliedPermissions` applied) and each scope column is null or equals the target. Grants from several assignments are combined, so they only add access. A target field that is left out matches only a null scope column, so a request with no target needs an unscoped assignment. Admins bypass the check in `hasPermission` and `decide` and skip the grant load.
- **Visibility means any `flag:*` permission.** A grant gives visibility if its role has `flag:read` after `withImpliedPermissions`, so an Auditor-only user sees no projects, entities or environments. A null scope column means "all", otherwise the filter is `id in (...)`, and no matching grants gives an empty list. A project or environment is visible if any grant covers it, even one limited to some entities or environments. Entities in a project use only the grants whose project is null or equals that project, and a non-admin with no such grant gets 404 `Project not found`.
- **Hidden resources return 404, forbidden actions return 403.** `isVisible` applies the same visibility rule to one target. On a denied request, `authorize` answers `NOT_FOUND` when the target is not visible and `FORBIDDEN` only when it is visible. `requires(permission, target)` decides this through `decide`. `adminOnlyOn(target)` does it for admin-only routes on one catalog row (`PATCH`, `DELETE` and restore of a project, entity or environment, and entity create). `adminOnlyHidden` answers 404 to every non-admin on routes addressed by a user id (`/users/:id...`, `/users/:userId/access...`), because users are never visible to non-admins. `adminOnly` stays 403 for collection routes with no target (create, reorder, list users), since there is nothing to hide. Both errors use the standard error shape. The manual check is `docs/authorization.md`.
- **Visibility is decided from the grants alone, with no row lookup.** Nonexistent, deleted and out-of-scope ids all give a non-admin the same 404 code and message, and a non-admin never reaches the service on an admin-only route.
- **`GET /access/available` returns the current user's projects and environments** (`id`, `key`, `name`, not paginated) for the assignment pickers. For an admin it returns everything, so it also serves as the full list the paginated endpoints can't give.
- **`scopeWhere` is the reusable filter for tables with all three scope columns.** It turns grants into one `OR` list of scope clauses, or an empty object when some grant is unscoped. Flags and `audit_logs` (L4) use it with `flag:read` and `audit:read`.
- **Grants are loaded on every check, never cached.** `userAccessRepository.findActiveGrantsByUserId` returns the user's active rows, and skips rows whose role, project, entity or environment is deleted. Use `hasPermission(user, permission, target)` when the target is only known inside a service.
- **Role keys are immutable and stay reserved**, like the catalog keys. `role_permissions` has no base columns because its rows are only join rows and are removed with their role (cascade).
- **Access is stored as one `user_access` row per entity and environment combination.** Rows created together share an `assignment_id` (a UUID made by the service). A null `project_id`, `entity_id` or `environment_id` means "all". `POST /users/:userId/access` takes `roleId`, `projectId`, `entityIds` and `environmentIds` (missing or empty means "all"), stores the cross product in one transaction, and `GET` returns the rows grouped by `assignmentId`.
- **Only active users of type `user` can be given access**, because admins bypass every check. `entityIds` requires a `projectId`, and every entity must belong to that project. The role, project, entities and environments must all be active. `assertTargets` in the user-access service holds these checks for both assign and update.
- **Duplicate access is refused in the service, not by an index.** A duplicate is an active row with the same user, role, project, entity and environment, where null matches only null. MySQL unique indexes treat nulls as distinct, so an index can't enforce it. Assign and update take a row lock on the target user first (`userRepository.lockById`, `SELECT ... FOR UPDATE`), then run `assertNotDuplicate` before every create and role change, so concurrent requests for the same user run one after the other. A duplicate returns 409 `Access already assigned`. Edits exclude their own assignment from the check, revoked rows never count, and the same scope with a different role is allowed.
- **Editing an assignment diffs combinations, it does not rewrite rows.** `PATCH /users/:userId/access/:assignmentId` takes optional `roleId`, `entityIds` and `environmentIds`. Each list is the full new set, an empty list means "all", and an omitted field keeps its value. Rows whose combination dropped out are soft-deleted, new combinations are created with the same `assignment_id`, and kept rows get the new role. The project of an assignment is immutable.
- **Revoking soft-deletes every row of the assignment.** `DELETE /users/:userId/access/:assignmentId` returns 404 for an unknown or already revoked assignment, like `PATCH`. Access is read from `user_access` on every request, so an edit or revoke applies on the user's next request.
- **Audit rows carry scope ids**: `project.*` sets `projectId`, `entity.*` sets `projectId` and `entityId`, `environment.*` sets `environmentId`. Environment reorder writes one `environment.updated` row per environment that moved. `access.assigned`, `access.updated` and `access.revoked` write one row per `user_access` row, with the scope ids that apply and `assignmentId`, `userId` and `roleId` in `metadata`. `access.updated` has `before: null` for a created row and `after: null` for a removed row, and `access.revoked` has `after: null`.
- **Users are created by admins only, with a server-generated temporary password.** `POST /users` takes `email`, `name` and `type`, trims and lowercases the email, and returns the new user plus `temporaryPassword` once, with `Cache-Control: no-store`. The password is random, bcrypt-hashed before the transaction, stored with `must_change_password = true`, and never logged. `temporaryPassword` is also in `SENSITIVE_FIELD_NAMES`, so it can't reach an audit row even by mistake. `user.created` is audited with a field-by-field snapshot of the new user.
- **User emails stay reserved after soft delete.** Creation checks `userRepository.findByEmailIncludingDeleted`, and a duplicate returns 409 `Email already in use`. `findByEmail` ignores deleted users and is only for login and setup. The unique index covers a race between two simultaneous creates (`P2002` maps to 409).
- **The last active admin can't be removed.** Deleting, disabling or demoting an admin returns 409 `LAST_ADMIN` when they are the only active admin. `assertNotLastAdmin` (`api/v1/users/users.utils.ts`) locks every active admin row (`userRepository.lockActiveAdminIds`, `ORDER BY id FOR UPDATE`) in the caller's transaction, so two admins removing each other at once run one after the other. Locking only the target row would not stop that.
- **Admins edit only `name` and `type`.** `PATCH /users/:id` rejects `email` and any unknown field. Setting `type` to `user` calls `assertNotLastAdmin` first. The change writes `user.updated` with before and after snapshots, and an edit that changes nothing writes nothing. `sessionVersion` is not bumped, so a type change applies on the user's next request because `requireAuth` reads the user on every request.
- **Disabling is reversible and separate from deleting.** `POST /users/:id/disable` and `/enable` set `is_active`. Disabling calls `assertNotLastAdmin` first and bumps `sessionVersion`, so the user's sessions are rejected on the next request, and login already refuses inactive users. Enabling does not bump it. Both write `user.disabled` or `user.enabled` with before and after snapshots, and repeating the current state writes nothing.
- **Password reset is admin-driven and returns the new password once.** `POST /users/:id/reset-password` generates a temporary password with `generateTemporaryPassword` (shared with user creation), stores its bcrypt hash with `must_change_password = true`, and bumps `sessionVersion` so every session ends on the next request. The password is returned only in that response, with `Cache-Control: no-store`. `user.password_reset` is audited with no before or after values, so no password data can reach the row.
- **Deleting a user is a soft delete and keeps the email reserved.** `DELETE /users/:id` sets `deleted_at` after `assertNotLastAdmin` and bumps `sessionVersion`, so the user's sessions end on the next request and login refuses them. `POST /users/:id/restore` clears `deleted_at` and keeps the user's `isActive` state. Access rows are not touched. Both write `user.deleted` or `user.restored` with before and after snapshots. Edit, disable, enable and reset-password return 404 for a deleted user.
- **The user list** (`GET /users`) is admin-only and paginated. `search` matches email or name with a contains match. `type` and `status` (`active`, `disabled`, `deleted`) are optional filters. Without `status`, deleted users are hidden. The list never selects `password` or `sessionVersion`: the repository uses an explicit `select`, so a new column is not exposed by default.
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
- **Each failure is logged once, at the boundary.** The error handler logs `request.error`. Services and controllers throw and do not log errors. Services log only decision snapshots (ids, booleans, counts) at branches that change the outcome, and `error` for invariant violations. Auth and authorization denials log their reason (`auth.denied`, `authorization.denied`, `authorization.hidden`), with `meta.userId` where the user is known.
- **`requestId` ties everything together.** It is the same id in log lines, `audit_logs.request_id`, the `x-request-id` header and the `requestId` field of every error body. A client-supplied id is accepted only if it matches `^[A-Za-z0-9_-]{8,36}$`, and `x-trace-id` only if it matches `^[A-Za-z0-9_-]{8,64}$`. Health cycles and `guardedJob` runs get their own `traceId` and no `requestId`.
- **Production logging is stdout only, synchronous JSON, no transport.** The platform's collector owns retention (target: 30 days, admin-only read) and the app cannot rewrite it.

## Gotchas

- Tailwind classes must be written literally. Dynamic class-string construction is silently dropped by the static scanner.
- Prisma exports model types as `<Model>Model` (e.g. `UserModel`), not the bare name.
- Flex children that truncate need `min-w-0` (this caused the Sidebar and Button overflow bugs).
- Nested routers need `mergeParams: true` (`secureRouter({ mergeParams: true })`, or `Router({ mergeParams: true })` for a plain router), or `:projectId` from the parent mount is invisible to validators and controllers. The same applies to `:userId` on the user-access router.
- `validateParams` only checks values. It doesn't replace `req.params`, so controllers still convert with `Number(req.params.id)`. The user-access controller reads `assignmentId` as a plain string.
- Server validation errors come back as one joined string (`"field: message; ..."`), not per field, so the frontend can't map them to fields. Keep the client schemas in sync with the backend ones. The log line `request.validation.failed` does carry the rejected field names.
- `GET /projects/:id` returns the project even when it is deleted, for admins only. Non-admins get 404 for a deleted or out-of-scope project. The project page still finds its project in the full list, which is now paginated, so move it to this endpoint before the frontend adopts pagination.
- `GET /projects` and `GET /projects/:projectId/entities` return `{ items, meta }`, not an array. The admin screens must read `data.items`. Anything that needs every project or environment (such as the Epic 4 assignment dropdown) must use `GET /access/available`, not the list: the page size is capped at 100.
- `projectRepository.findPage` and `entityRepository.findPageByProject` replaced `findAll` and `findByProject`. Check for other callers before reintroducing a full-list read.
- A restored environment keeps its old `sortOrder` and can land mid-list or tie with another. The next reorder normalizes the values.
- `useApiQuery` needs a stable `request` reference, so wrap parameterized service calls in `useCallback` (see `useEnvironments`).
- Mount order in `app.ts`: `requestId`, `requestLogger`, `cors`, `diagnosisGuard`, `json`, session. A new public or infra route that must work while `DOWN` goes in `GUARD_EXEMPT_PATHS`, which also skips the session middleware.
- `diagnosis.recordCycleResult` is for the scheduler only. Never call it from request code.
- Wrap every new background job or scheduled action in `guardedJob`. It also gives the run its own `traceId` for logs.
- Replayed audit rows keep their original `created_at`, so `id` order is not time order. Sort audit views by `created_at`.
- Inside `lib/diagnosis` and `lib/audit`, import from `@/lib/errors` and `@/lib/logger`, not the `@/lib` barrel, to avoid a circular import.
- `console` is a lint error in the backend. Only the env boot error (`config/env/env.ts`) and `config/db/seed.ts` are exempt. Use `getLogger(scope)`.
- A new log scope must be added to `LOG_SCOPES` in `config/env/constant.ts`. Setting `LOG_SCOPES` in `.env` limits every scope that is not listed to `warn` and above.
- `data` accepts primitives and arrays of primitives only. Never pass user strings, bodies or objects.
- `instrument` wraps the exported functions of a service module and logs only top-level number and boolean arguments. Helpers inside a service file are not wrapped, so give them a decision snapshot line if they matter.
- `asyncHandler` takes async handlers only, so a synchronous handler such as `getMe` stays outside it and has no controller lines.
- Middleware that runs before the error handler (`asyncHandler`, `validate*`, `requireAuth`, `authorize`, `requireSetupKey`) calls `recordRoute`. Express resets `baseUrl` before the error handler runs, so without it error lines show a partial route.
- `authorize` calls `recordRoute` itself, because the `requireAuth` that `secureRouter` mounts runs at `router.use` level, where `req.route` is not set yet.
- Register routes with `secureRouter`, not `Router()`, unless the route is public or infra (`auth`, `health`, `diagnosis`). A plain `Router` has no declaration check. A nested secure router (entities under projects, user-access under users) runs `requireAuth()` again, so those requests read the user twice.
- A route with the `scoped` rule has no permission check, so the service must filter by the user's scope. Never register a `scoped` route whose service ignores `resolveScope`.
- `scoped` routes return empty results, not 403, for a user with no access. Only the entity list and `GET /projects/:id` return 404.
- Target resolvers in `requires(permission, target)` and `adminOnlyOn(target)` run before `validateParams`, so `Number(req.params.x)` can be `NaN`. For permission checks a `NaN` matches only null scope columns, so it never grants more access. For visibility it counts as hidden unless the user's scope is `all`.
- An entity target must carry its `projectId` too. An `entityId` without a `projectId` counts as hidden.
- Use `adminOnlyOn` or `adminOnlyHidden`, not `adminOnly`, on any new admin-only route that addresses one row by id. Plain `adminOnly` returns 403 for ids the user can't see, which breaks the 404 rule.
- The check runs before request validation, so a denied request never reaches the validators.
- MySQL 8.4 auth cache: after a container restart the pool only reconnects with `allowPublicKeyRetrieval=true` (dev) or TLS (prod). See `docs/troubleshooting.md`.
- `TRUST_PROXY_HOPS` must match the real number of proxies in production. A wrong value lets clients spoof `req.ip` through `x-forwarded-for`.
- While `DOWN`, the guard marks its 503s and `request.finish` logs them at `warn`, so an outage doesn't create an error line per request.
- A lost audit event (DB, Redis and spool all failed) logs only `action` and `auditEventId`, never the payload, because audit metadata can hold an attempted email.
- The seed only adds missing role permissions (`skipDuplicates`) and never overwrites existing roles. Removing a permission from `DEFAULT_ROLES` does not remove it from an existing database.
- `config/db/seed.ts` imports `lib/permissions` by relative path, like its `../constants` import.
- `user_access` foreign keys are `Restrict`, so soft-deleting a user, role, project, entity or environment leaves its access rows in place. `findActiveGrantsByUserId` ignores rows whose role, project, entity or environment is deleted, and a deleted or disabled user never reaches it because `requireAuth` rejects them first. Any new code that reads `user_access` for access decisions must do the same.
- `userRepository.lockById` must be the first statement in its transaction. The duplicate check relies on the lock being taken before any read, so it sees rows committed by the request it waited for.
- `/users/:userId/access` is mounted inside `usersRouter` (`api/v1/users`), behind its `adminOnlyHidden` rules. Add new user routes there. `api/v1/index.ts` must not also mount the access router on its own.
- Use `findByEmailIncludingDeleted` for any uniqueness check on user emails. `findByEmail` hides deleted rows and would let a reserved email through.
- `userRepository.findPage` is the only user read that uses `select`. Its result type is `UserListItem`, not `User`. Add new list fields to `LIST_SELECT` on purpose.
- Every user change that deletes, disables (`isActive: false`) or demotes (`type: user`) must call `assertNotLastAdmin(tx, userId)` as the first statement of its transaction. The lock must come before any other read, like `lockById`.

## Current state

- Done: auth (setup, login, logout, `requireAuth`/`requireAdmin`, forced password change), audit logging, health check (DB + Redis), diagnosis service (backend core, wiring, audit fallback, frontend gate, manual test matrix), backend logging (see `docs/logging.md`), shared UI kit, app shell, account menu, profile modal (untested)
- Logging: logger core, request context, controller and service path logging, DB and Redis logging, boundary logging for errors, validation and auth, diagnosis, audit fallback and process logging, and the `no-console` lint rule. Error responses carry `requestId`, but the frontend does not show it yet, and there is no frontend error reporting.
- Catalog (backend): environments, projects and entities have admin CRUD with soft delete, restore and audit logging. Environments also support reorder. Projects have `GET /projects/:id`. The project and entity lists are paginated (`page`, `limit`, `includeDeleted`). The seed creates `dev`, `staging` and `production`. Reads are filtered by the user's scope (R6), and writes are admin-only.
- Catalog (frontend): admin screens for environments, projects and entities (see Admin routes), built on the shared `resource-list` kit. The toolbar only has "Show deleted" so far; search and filters are not built. The project and entity screens still expect arrays and have no pager, so they must be updated for the paginated responses.
- Roles (backend): permission list, `roles` and `role_permissions` tables, and the seeded Viewer, Editor, Approver and Auditor roles (R1). Role CRUD is not built yet.
- Access (backend): `user_access` table and admin endpoints to assign (R2), edit and revoke (R3) a user's access, and to list a user's assignments grouped by `assignmentId`. Assign and edit validate scope and reject duplicates under a user row lock (R4). The central check (R5) is built: routes declare `adminOnly`, `adminOnlyOn`, `adminOnlyHidden`, `scoped` or `requires(...)` through `secureRouter`, and undeclared routes are denied. The scope filter (R6) is built, and `GET /access/available` returns the user's projects and environments. Hidden resources answer 404 and forbidden actions 403 (R7), checked by hand with `docs/authorization.md`. No route uses `requires(...)` yet.
- Access (frontend): not built. The admin UI warning when "all projects" is chosen (R4) goes with the assignment screen.
- Users (backend): admin-only user management is complete: create with a temporary password (U1), list with pagination, search and filters (U2), edit name and type (U3), disable and enable (U4), reset password (U5), delete and restore (U6). The last-admin guard (U7) is called by U3, U4 and U6. Not built: last login in the list, and the users admin screen.
- Pagination: `lib/pagination` is shared by users, projects and entities (backend only).
- Admin area: Users, Audit and the dashboard are placeholders.
- Needs verification: Button and Sidebar overflow fixes, Profile modal (long names, mobile widths, change-password-from-profile flow), catalog screens at mobile widths, and that the sidebar highlights Projects on `/admin/projects/[id]`

## Next

1. Frontend for paginated lists: a pager in `resource-list`, then `feature/projects` and `feature/entities` read `{ items, meta }`, and the project page uses `GET /projects/:id`
2. Verify the overflow fixes, Profile modal and catalog screens
3. Search and filters in the resource toolbar (client-side first for environments, server-side for paginated lists)
4. Epic 4: the frontend assignment screen with the "all projects" warning, using `GET /access/available` for the pickers
5. Show `requestId` in frontend error toasts, and later add frontend error reporting

## New resource checklist

Prisma model + migration, repository, `api/v1/<resource>/` module with its router built on `secureRouter` and a rule declared on every route (`adminOnlyOn` or `adminOnlyHidden` for admin-only routes that address one row), register in `api/v1/index.ts` (nested resources: mount under the parent router, with `mergeParams: true`), audit calls, a scope in `LOG_SCOPES`, `<resource>.instrumented.ts` wrapping the service (the controller imports from it), decision snapshot lines at outcome-changing branches, a paginated list built on `lib/pagination` if the table can grow, then `feature/<resource>/` on the frontend (build the list on `ResourceList` / `ResourceRow`) and the matching `app/admin/<resource>/page.tsx`.
