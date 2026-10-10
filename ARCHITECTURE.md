# Flagger: Architecture

Flagger is a full-stack feature flag system (backend + frontend) with extra features built to showcase engineering skill: granular permissions, admin and normal users, a rule engine, a diagnosis service, structured logging, and multi-eye approval flows.

## Planned features

- Granular permissions (Epic 4: roles and access scoping)
- Rule engine (flag targeting and evaluation rules)
- Approval flow with multi-eye (multiple approver) sign-off

Built: admin and normal user areas, diagnosis service (`docs/diagnosis.md`), structured logging (`docs/logging.md`).

## Stack

- Monorepo: pnpm workspace (`backend/`, `frontend/`, `docs/`)
- Backend: Express + TypeScript, Prisma + MySQL, Redis sessions (`connect-redis` + `redis` client; not `ioredis`), pino for logging
- Frontend: Next.js App Router, Tailwind, light/dark theme tokens, react-hook-form + zod

## Backend structure

- `src/server.ts`: the entry point. It calls `registerProcess()`, starts listening, then starts the background jobs, hands their stop functions to `registerShutdown` and connects the dependencies in the background.
- `src/process/`: process lifecycle, split by job
  - `bootstrap` (`registerProcess`: the one-time registrations that must happen before listening: default health checks, diagnosis audit, Redis health listeners, crash handlers)
  - `crash-handlers` (`unhandledRejection`, `uncaughtException`)
  - `dependencies` (`registerRedisHealthListeners`, which marks the system `DOWN` on Redis errors, and `connectDependencies`, which connects DB and Redis in the background and runs one health cycle afterwards)
  - `shutdown` (`registerShutdown(server, stoppers)`: SIGTERM and SIGINT, stops the background jobs, closes the server, disconnects DB and Redis, forces exit after a timeout)
  - `exit` (`exitAfterFlush`)
- `src/app.ts`: builds the Express app and mounts the app middleware in order, then `router`, `notFound` and `errorHandler`.
- `src/router.ts`: mounted at the root. It serves `GET /` (the API status response) and mounts the versioned API at `/api/v1`.
- `src/api/v1/<resource>/`: `.router`, `.controller`, `.service`, `.instrumented`, `.validator`, `.types`, `.constants`, `.utils`, exported via `index.ts`. The controller imports the service from `.instrumented`, which wraps it for path logging.
- `src/repositories/<model>/`: all data access (Prisma lives here)
- `src/lib/`: cross-cutting code. Nothing in `lib/` imports from `@/middleware`.
  - `auth` (`requireAuth`, `requireAdmin`), `session`, `errors` (AppError, error codes)
  - `audit` (writer plus the outage fallback)
  - `diagnosis` (system health state, scheduler, `isDiagnosisExempt`; the guard middleware lives in `middleware/app`)
  - `logger` (pino logger, request context, `instrument`, redaction)
  - `permissions` (the fixed permission list and its helpers)
  - `authorization` (access rules, `secureRouter`, `authorize`, the grant resolver, the scope helpers that turn grants into list filters, the 404-or-403 visibility check, and the capability helpers)
  - `pagination` (page/limit query schema, `getSkipTake`, `toPaginatedData`, the `PaginatedData` types)
- `src/middleware/`: Express middleware, in two groups. Both are re-exported from `middleware/index.ts`.
  - `app/`: mounted once in `app.ts`: `request-id`, `request-logger`, `cors` (`corsMiddleware`), `diagnosis-guard`, `session-unless-exempt` (`sessionUnlessExempt`), `not-found`, `error-handler` (the one place errors are logged and sent; maps Prisma `P2002` to 409)
  - `route/`: used per route: `async-handler` (forwards rejected promises to the error handler), `validate` (`validateBody`, `validateParams`, `validateQuery`)
- `src/config/`: must not import from `lib/` (the logger imports `config/env`, so the reverse would be circular)
  - `env/`: `env.ts` is the zod schema for every environment variable and exports the frozen `env` object (defaults sit next to their setting; invalid values print the variable name and message, never the value, then exit). `log-scopes.ts` holds the `LOG_SCOPES` list and imports nothing.
  - `db/`: `client.ts` (Prisma client, `connectDatabase`, `disconnectDatabase`), `logging.ts` (the Prisma query, warn and error log handlers), `seed.ts` and `seed.constants.ts` (default system settings, environments and roles)
  - `redis/`: `client.ts` (Redis client, lifecycle log listeners, `connectRedis`, `disconnectRedis`)
- `src/generated/prisma/` is auto-generated. Never edit or read it.
- Models: `User`, `SystemSetting`, `AuditLog`, `Environment`, `Project`, `Entity`, `Role`, `RolePermission`, `UserAccess` (`prisma/schema.prisma`)

## Frontend structure

- `app/`: routes and layouts only (`/admin/*` is guarded; the admin layout also sets page padding and max width). The app shell (sidebar + scrollable main, no navbar or footer) lives here because it composes several features. The root `not-found.tsx` and `error.tsx` render the shared state screens.
- `feature/<name>/`: domain logic + components (`.service`, `.hook`, `.validator`, `.types`, `.constants`, `components/`, exported via `index.ts`). List features keep their page size in their constants (`USERS_PAGE_SIZE`, `PROJECTS_PAGE_SIZE`, `ENTITIES_PAGE_SIZE`).
- `feature/users/` also holds the access assignment form (`user-access.*` files and the `access-card` and `user-access-section` components), because features don't import each other.
- `feature/diagnosis/` + `shared/lib/diagnosis/`: `DiagnosisGate` wraps the app shell. The store is in `shared/lib` because `api.ts` flips it.
- `shared/lib/auth/`: the auth store (`status`, `user`, and an optional `reason`). It is in `shared/lib` for the same reason: `api.ts` flips it.
- `shared/components/{ui,layout,form,feedback}/`: reusable primitives
  - `ui`: Button, Badge, Avatar, Modal (sizes `sm` to `xl`), ConfirmDialog, Popover
  - `form`: `Field` (with `Field.Input`, `Field.Textarea`, `Field.Select`, `Field.MultiSelect`, `Field.Toggle`), `FormError`
  - `feedback`: Toast, Loader, `Notice` (themed inline warning or info), and the state screens (`StateScreen`, `NoAccessState`, `NotFoundState`, `ErrorState`, `ApiErrorScreen`)
  - `layout`: Sidebar, `Pager`, and the `resource-list` kit
- `shared/components/feedback/state-screen/`: `StateScreen` is the centered icon, title, description and optional action block. `NoAccessState`, `NotFoundState` and `ErrorState` are its ready-made variants, and each takes an optional `action` node. `ApiErrorScreen` maps an error code (`FORBIDDEN`, `NOT_FOUND`) to the matching variant and renders nothing for other codes.
- `shared/components/layout/resource-list/`: the admin list kit. `ResourceList` (header, loading/error/empty states), `ResourceToolbar` (optional show-deleted toggle, plus `search` and `filters` slots) and `ResourceRow` (card row, stacks on mobile).
- `shared/components/layout/pager/`: `Pager` (previous/next, page and total text). It renders nothing when there is only one page and sits after `ResourceList`, not inside it.
- `shared/{lib,hooks,config,theme,types,constants}/`
  - `lib`: API client (with the global response interceptor) and error helpers
  - `hooks`: `api-query.hook` (read on mount, returns `data`, `loading`, `error`, `errorCode`, `refetch`), `use-action.hook` (one-off mutations: busy state, error toast, optional success toast, then refetch), `use-debounced-value.hook`
  - `types`: `ApiResponse`, `ErrorResponse`, `PaginatedData`, `PaginationMeta`
  - `constants`: `ERROR_CODES`

### Admin routes

- `/admin/users`: list (search, type and status filters, pager), create (two steps: details, then access), edit (including access), disable, enable, reset password, delete, restore
- `/admin/environments`: list, create, edit, delete, restore, reorder
- `/admin/projects`: list (pager), create, edit, delete, restore
- `/admin/projects/[id]`: the project's entities (list with pager, create, edit, delete, restore). A missing, malformed or hidden project id shows the not-found state.
- Audit and the dashboard are still placeholders.

## Key decisions

### Auth and sessions

- **Session auth, not JWT.** Sessions live server-side in Redis. The client cookie holds only `userId` + `sessionVersion`. Bumping `sessionVersion` on password change logs out all other sessions (intentional).
- **Every auth action is audit-logged** via `lib/audit`.
- First-admin setup is one-time and key-gated.

### Permissions and authorization

- **Permissions live in code, roles live in the DB.** `lib/permissions` is the single list (`flag:read|create|update|delete|approve`, `audit:read`). `role_permissions.permission` is a validated string, not a DB enum, so a new permission needs no migration. Every write to it goes through `assertPermissions`. Admin is a user type that bypasses all checks, not a permission.
- **Any `flag:*` permission implies `flag:read`.** This is computed by `withImpliedPermissions` when permissions are resolved and never stored, so seeded roles keep exactly the permissions they were given. `flag:update` means proposing a change, `flag:approve` means approving one.
- **Role keys are immutable and stay reserved**, like the catalog keys. `role_permissions` has no base columns because its rows are only join rows and are removed with their role (cascade).
- **Every route declares its access rule, and no declaration means denied.** Routes are registered through `secureRouter()` (`lib/authorization`), whose `get`, `post`, `put`, `patch` and `delete` take the rule right after the path: `adminOnly`, `adminOnlyOn(target)`, `adminOnlyHidden`, `scoped` or `requires(permission, target?)`. Leaving it out is a type error, and a missing rule at runtime returns 403 and logs `authorization.undeclared`. `secureRouter` also mounts `requireAuth()`. Public and infra routers (`auth`, `health`, `diagnosis`) use a plain `Router`.
- **One function decides.** `isAllowed` (`lib/authorization/resolver.ts`) allows an action if some grant has the permission through its role (with `withImpliedPermissions` applied) and each scope column is null or equals the target. Grants from several assignments are combined, so they only add access. A target field that is left out matches only a null scope column, so a request with no target needs an unscoped assignment. Admins bypass the check in `hasPermission` and `decide` and skip the grant load.
- **Grants are loaded on every check, never cached.** `userAccessRepository.findActiveGrantsByUserId` returns the user's active rows and skips rows whose role, project, entity or environment is deleted. Use `hasPermission(user, permission, target)` when the target is only known inside a service.
- **Visibility means any `flag:*` permission.** A grant gives visibility if its role has `flag:read` after `withImpliedPermissions`, so an Auditor-only user sees no projects, entities or environments. A null scope column means "all", otherwise the filter is `id in (...)`, and no matching grants gives an empty list. A project or environment is visible if any grant covers it, even one limited to some entities or environments. Entities in a project use only the grants whose project is null or equals that project, and a non-admin with no such grant gets 404 `Project not found`.
- **Hidden resources return 404, forbidden actions return 403.** On a denied request, `authorize` answers `NOT_FOUND` when the target is not visible (`isVisible`) and `FORBIDDEN` only when it is visible.
  - `requires(permission, target)` decides this through `decide`.
  - `adminOnlyOn(target)` does it for admin-only routes on one catalog row (`PATCH`, `DELETE` and restore of a project, entity or environment, and entity create).
  - `adminOnlyHidden` answers 404 to every non-admin on routes addressed by a user id (`/users/:id...`, `/users/:userId/access...`), because users are never visible to non-admins.
  - `adminOnly` stays 403 for collection routes with no target (create, reorder, list users, list roles), since there is nothing to hide.
  - Visibility is decided from the grants alone, with no row lookup. Nonexistent, deleted and out-of-scope ids give a non-admin the same 404 code and message, and a non-admin never reaches the service on an admin-only route. The manual check is `docs/authorization.md`.
- **Capabilities use the same decision code as routes.** `ruleAllows(rule, user, grants, target)` is the one function that answers "does this rule allow this user on this target". `authorize` and the capability helpers both use it, so a rule change can't make the UI and the API disagree. `createAccessChecker(user)` loads the grants at most once per call, and not at all for admins.
- **Read responses carry item capabilities.** The environments list, projects list, `GET /projects/:id` and entities list return each item with `capabilities: { canUpdate, canDelete, canRestore }` (`withCatalogCapabilities`). A deleted item can only be restored, and a live one can only be updated or deleted. Write responses (create, update, restore) do not carry them, so the UI refetches after a write. Hiding a button is convenience only: the route rules still enforce everything.
- **`GET /auth/me` returns the user's overall capabilities** (`getOverallCapabilities`): `isAdmin`, `canManageUsers`, `canManageCatalog`, and the flag and audit permissions held in any assignment. Collection-level buttons (create project, create entity, reorder) use `canManageCatalog`. While `mustChangePassword` is true, every capability is false (`NO_CAPABILITIES`).
- **`scopeWhere` is the reusable filter for tables with all three scope columns.** It turns grants into one `OR` list of scope clauses, or an empty object when some grant is unscoped. Flags and `audit_logs` (L4) use it with `flag:read` and `audit:read`.

### Catalog (environments, projects, entities)

- **Catalog keys are immutable and stay reserved.** `Environment`, `Project` and `Entity` keys can't change after creation, and the unique index covers soft-deleted rows, so a deleted key can only come back through restore. Entity keys are unique per project, and `project_id` is immutable too.
- **Entities are nested** under their project (`/projects/:projectId/entities`). Every entity route needs an active parent project (404 otherwise). Soft-deleting a project does not cascade to its entities. In the UI, entities are managed on the project's page, not as a top-level admin screen.
- **Catalog reads are scoped, catalog writes are admin-only.** The three list endpoints, `GET /projects/:id` and `GET /access/available` use the `scoped` rule: any authenticated user passes, and the service turns the user's grants into a database filter (`resolveScope`, `resolveEntityScope`, `toIdFilter`), so unpermitted rows never leave the database and pages and counts stay correct. Admins get no filter. Non-admins never see deleted rows, whatever `includeDeleted` says.
- **`GET /access/available` returns the current user's projects and environments** (`id`, `key`, `name`, not paginated) for the assignment pickers. For an admin it returns everything, so it also serves as the full list the paginated endpoints can't give.
- **Environment order** is set with `PUT /environments/order`, which takes every active id exactly once and returns the full active list. The UI uses up/down buttons (no drag-and-drop dependency, works on mobile and by keyboard).

### Pagination

- **List endpoints use shared pagination.** `lib/pagination` provides `paginationQuerySchema` (`page` from 1, `limit` default 20, max 100). A list extends it for its own filters, then the service uses `getSkipTake` and `toPaginatedData`, and the response is `{ items, meta }` (`PaginatedData`). The repository runs `findMany` and `count` with the same `where`. Users, projects and entities are paginated. Environments are not, because `PUT /environments/order` and the UI need every id.
- **Paginated screens own their page state.** The service takes `page` and `limit`, the screen passes its `*_PAGE_SIZE`, and `<Pager>` renders from `meta`. Changing a filter, a search or the show-deleted toggle resets to page 1. If a page empties after a delete, the screen steps back to the last page.

### Access assignments

- **Access is stored as one `user_access` row per entity and environment combination.** Rows created together share an `assignment_id` (a UUID made by the service). A null `project_id`, `entity_id` or `environment_id` means "all". `POST /users/:userId/access` takes `roleId`, `projectId`, `entityIds` and `environmentIds` (missing or empty means "all"), stores the cross product in one transaction, and `GET` returns the rows grouped by `assignmentId`.
- **Only active users of type `user` can be given access**, because admins bypass every check. `entityIds` requires a `projectId`, and every entity must belong to that project. The role, project, entities and environments must all be active. `assertTargets` in the user-access service holds these checks for both assign and update.
- **Duplicate access is refused in the service, not by an index.** A duplicate is an active row with the same user, role, project, entity and environment, where null matches only null. MySQL unique indexes treat nulls as distinct, so an index can't enforce it. Assign and update take a row lock on the target user first (`userRepository.lockById`, `SELECT ... FOR UPDATE`), then run `assertNotDuplicate` before every create and role change, so concurrent requests for the same user run one after the other. A duplicate returns 409 `Access already assigned`. Edits exclude their own assignment from the check, revoked rows never count, and the same scope with a different role is allowed.
- **Editing an assignment diffs combinations, it does not rewrite rows.** `PATCH /users/:userId/access/:assignmentId` takes optional `roleId`, `entityIds` and `environmentIds`. Each list is the full new set, an empty list means "all", and an omitted field keeps its value. Rows whose combination dropped out are soft-deleted, new combinations are created with the same `assignment_id`, and kept rows get the new role. The project of an assignment is immutable.
- **Revoking soft-deletes every row of the assignment.** `DELETE /users/:userId/access/:assignmentId` returns 404 for an unknown or already revoked assignment, like `PATCH`. Access is read from `user_access` on every request, so an edit or revoke applies on the user's next request.
- **`GET /access/roles` is admin-only and unpaginated** (`id`, `key`, `name`, `description`). It feeds the role picker in the assignment form, since Role CRUD does not exist yet.
- **The user form edits access as cards.** Each card is one `assignmentId`: project (or all, with a warning), role, entities and environments (empty means all), and a plain-language summary. Entities load per project through `GET /projects/:projectId/entities?limit=100`, are disabled until a project is chosen, and are cleared when the project changes.
  - Create is a two-step form (details, then access): `POST /users`, then one `POST /users/:userId/access` per card. Admin-type users skip the access step.
  - Edit is a single form. It loads the user's assignments first and diffs the cards against them, sending only revoke, `PATCH` or `POST` calls. A project change is revoke plus assign, because the project is immutable, and revokes run first so a removed card can be re-added without a 409.
  - If an access call fails, the user is still saved and a persistent error toast shows the count and the first message. A duplicate surfaces from the backend 409, with no client-side duplicate check.
  - Switching a user to type `admin` leaves their existing access rows untouched, as the backend does.

### Users

- **Users are created by admins only, with a server-generated temporary password.** `POST /users` takes `email`, `name` and `type`, trims and lowercases the email, and returns the new user plus `temporaryPassword` once, with `Cache-Control: no-store`. The password is random, bcrypt-hashed before the transaction, stored with `must_change_password = true`, and never logged. `temporaryPassword` is also in `SENSITIVE_FIELD_NAMES`, so it can't reach an audit row even by mistake. `user.created` is audited with a field-by-field snapshot of the new user.
- **User emails stay reserved after soft delete.** Creation checks `userRepository.findByEmailIncludingDeleted`, and a duplicate returns 409 `Email already in use`. `findByEmail` ignores deleted users and is only for login and setup. The unique index covers a race between two simultaneous creates (`P2002` maps to 409).
- **The last active admin can't be removed.** Deleting, disabling or demoting an admin returns 409 `LAST_ADMIN` when they are the only active admin. `assertNotLastAdmin` (`api/v1/users/users.utils.ts`) locks every active admin row (`userRepository.lockActiveAdminIds`, `ORDER BY id FOR UPDATE`) in the caller's transaction, so two admins removing each other at once run one after the other. Locking only the target row would not stop that.
- **Admins edit only `name` and `type`.** `PATCH /users/:id` rejects `email` and any unknown field. Setting `type` to `user` calls `assertNotLastAdmin` first. The change writes `user.updated` with before and after snapshots, and an edit that changes nothing writes nothing. `sessionVersion` is not bumped, so a type change applies on the user's next request because `requireAuth` reads the user on every request.
- **Disabling is reversible and separate from deleting.** `POST /users/:id/disable` and `/enable` set `is_active`. Disabling calls `assertNotLastAdmin` first and bumps `sessionVersion`, so the user's sessions are rejected on the next request, and login already refuses inactive users. Enabling does not bump it. Both write `user.disabled` or `user.enabled` with before and after snapshots, and repeating the current state writes nothing.
- **Password reset is admin-driven and returns the new password once.** `POST /users/:id/reset-password` generates a temporary password with `generateTemporaryPassword` (shared with user creation), stores its bcrypt hash with `must_change_password = true`, and bumps `sessionVersion` so every session ends on the next request. The password is returned only in that response, with `Cache-Control: no-store`. `user.password_reset` is audited with no before or after values, so no password data can reach the row.
- **Deleting a user is a soft delete and keeps the email reserved.** `DELETE /users/:id` sets `deleted_at` after `assertNotLastAdmin` and bumps `sessionVersion`, so the user's sessions end on the next request and login refuses them. `POST /users/:id/restore` clears `deleted_at` and keeps the user's `isActive` state. Access rows are not touched. Both write `user.deleted` or `user.restored` with before and after snapshots. Edit, disable, enable and reset-password return 404 for a deleted user.
- **The user list** (`GET /users`) is admin-only and paginated. `search` matches email or name with a contains match. `type` and `status` (`active`, `disabled`, `deleted`) are optional filters. Without `status`, deleted users are hidden. The list never selects `password` or `sessionVersion`: the repository uses an explicit `select`, so a new column is not exposed by default.

### Audit

- **Audit rows carry scope ids**: `project.*` sets `projectId`, `entity.*` sets `projectId` and `entityId`, `environment.*` sets `environmentId`. Environment reorder writes one `environment.updated` row per environment that moved. `access.assigned`, `access.updated` and `access.revoked` write one row per `user_access` row, with the scope ids that apply and `assignmentId`, `userId` and `roleId` in `metadata`. `access.updated` has `before: null` for a created row and `after: null` for a removed row, and `access.revoked` has `after: null`.
- **Audit events that must survive an outage use `recordAuditEvent`** (DB, then a Redis list, then a local spool file) and are replayed after recovery. Each carries a unique `eventId` and its original timestamp. Every fallback and replay is logged.

### Diagnosis

- **Diagnosis owns system health, the scheduler owns recovery, the frontend only reflects it.** The system boots `DOWN` and any critical error marks it `DOWN` at once. Only one fully clean scheduler cycle moves it back to `UP`; a successful request never does. While `DOWN`, the guard returns 503 and `guardedJob` skips background work.
- **Status is per instance, in memory.** A Redis-backed status would be unreadable when Redis is down.
- **The server starts with dependencies down.** DB and Redis connect in the background (`connectDependencies`), and a failed connect is logged (`db.connect.failed`, `redis.connect.failed`), not fatal. `connectDatabase` and `connectRedis` throw the original driver error, so the log goes through the normal error redaction. One health cycle runs after both connects have settled.
- **Shutdown stops background work first.** On SIGTERM or SIGINT, `registerShutdown` stops the diagnosis scheduler and the audit drain, closes the HTTP server, then disconnects DB and Redis. A 10 second timer forces the exit if any step hangs.

### Logging

- **App logs are separate from the audit log.** Audit answers who changed what (DB, permanent). The logger answers what the system did, in order (JSON to stdout in production, pretty console in dev, no log file). The logger imports only `config/env`, so it keeps working when the DB and Redis are down.
- **One log shape for every line:** `level, time, service, env, scope, event, msg, requestId, traceId, meta, data, err`. `event` is a fixed dotted name for filtering, `msg` is the readable sentence, `meta` holds `userId`, `sessionVersion` and `userType`, and `data` holds the event values (primitives and arrays of primitives only). Absent fields are omitted, never `null`.
- **Log everything, structured, always on.** Request start/finish/aborted and service start/end are `info`, SQL text is `trace`. Slow queries are `warn` and `error` at `LOG_SLOW_QUERY_WARN_MS` and `LOG_SLOW_QUERY_ERROR_MS`. Each request ends with a summary in `request.finish` (`queryCount`, `dbTimeMs`, `services`). Controllers are not logged: the request summary and the service lines cover them.
- **Log events, never values.** Never log passwords, hashes, cookies, session ids, tokens, the setup key, request or response bodies, SQL params or emails. Redaction is central (`lib/logger/redact.ts`), and errors are reduced to type, message, code and stack frames (Prisma messages are replaced by their code).
- **Each failure is logged once, at the boundary.** The error handler logs `request.error`. Services and controllers throw and do not log errors. Services log only decision snapshots (ids, booleans, counts) at branches that change the outcome, and `error` for invariant violations. Auth and authorization denials log their reason (`auth.denied`, `authorization.denied`, `authorization.hidden`), with `meta.userId` where the user is known.
- **`requestId` ties everything together.** It is the same id in log lines, `audit_logs.request_id`, the `x-request-id` header and the `requestId` field of every error body. A client-supplied id is accepted only if it matches `^[A-Za-z0-9_-]{8,36}$`, and `x-trace-id` only if it matches `^[A-Za-z0-9_-]{8,64}$`. Health cycles and `guardedJob` runs get their own `traceId` and no `requestId`.
- **Production logging is stdout only, synchronous JSON, no transport.** The platform's collector owns retention (target: 30 days, admin-only read) and the app cannot rewrite it.

### Frontend patterns

- **Modals over pages** for login, forced password change, profile, settings, the temporary password, and the create/edit forms of the admin screens. Keeps one persistent shell and avoids route-guard sprawl.
- **Features don't import each other.** Duplicate tiny constants instead (documented inline where done). The frontend validators duplicate the backend limits, key pattern and user types for the same reason.
- **Form errors:** invalid input shows inline per field (client zod schema mirrors the server). A `CONFLICT` response is shown on the key field (the email field for users, and a duplicate email returns the create form to its details step). `LAST_ADMIN` on the user edit form is shown on the type field. Access card errors show on their card. Any other failure is a form-level `FormError` banner. Delete, restore, disable, enable, reset and reorder failures are toasts via `useAction`.
- **Multi-step forms keep one form instance.** The create-user form keeps its state in the parent form, so going back keeps typed values and access cards. The first step validates through the same zod schema as the final submit, and the access cards are validated on the final step.
- **Confirmations:** destructive and session-ending actions (delete, disable, reset password) and restore and enable go through `ConfirmDialog`, which stays open and shows a loading state while the call runs.
- **Temporary passwords are shown once.** Create user and reset password open a non-dismissible modal with a warning and a copy button. The password lives only in component state and is dropped when the modal closes. It is never persisted or logged.
- **Theme tokens only.** Shared controls use the semantic tokens (`bg-surface`, `border-border`, `bg-primary`, `text-muted`, ...), never hard-coded colors, so they follow light and dark mode.
- **`Field.Select` and `Field.MultiSelect` are custom listboxes, not native `<select>`.** Their panels render in a portal with fixed positioning, so modals and scroll containers can't clip them, and they flip upward when there is no room below. `Field.Select` takes `options`, `value`, `onValueChange` and a `width` prop (`sm`, `md`, `lg`, `full`) for a fixed trigger width. `Field.MultiSelect` takes a `string[]` value and an optional `allLabel`: choosing it clears the selection, and an empty selection means "all". Both close on outside click, outside scroll and resize, and Escape closes only the dropdown, not the parent modal.
- **`Field.Toggle` is a controlled switch** (`checked`, `onCheckedChange`, optional `label`). It is used for "Show deleted".
- **`Notice` is the inline banner for warnings and info** (`variant="warning" | "info"`). `FormError` stays for form-level errors, and toasts are for transient results.
- **Session and connectivity errors are handled once, in the axios response interceptor** (`shared/lib/api.ts`). No response or a 503 flips the diagnosis store `DOWN`, and `DiagnosisGate` shows the unreachable screen. `SESSION_EXPIRED` calls `setUnauthenticated("expired")`, and the login modal shows an info `Notice` ("Your session expired") above the form. `UNAUTHENTICATED` calls `setUnauthenticated()` with no reason, so a first visit with no session shows no message. A successful login clears the reason. Screens never handle these cases themselves.
- **403 and 404 are not handled globally, screens decide.** `useApiQuery` exposes `errorCode`. A page that reads one resource shows `NotFoundState` for `NOT_FOUND` (the project page does) and `NoAccessState` for `FORBIDDEN`, or both through `ApiErrorScreen`. Because hidden and missing resources return the same 404 (R7), the not-found state never reveals whether the resource exists. List screens need no state screen: scoped lists return empty results, not 403 or 404. Failed forms and actions keep their toasts and banners.
- **Unmatched routes and render errors use the same screens.** `app/not-found.tsx` renders `NotFoundState` and `app/error.tsx` renders `ErrorState` with a "Try again" button that calls `reset`. Both render inside the app shell.

## Gotchas

### Backend

- Prisma exports model types as `<Model>Model` (e.g. `UserModel`), not the bare name.
- Nested routers need `mergeParams: true` (`secureRouter({ mergeParams: true })`, or `Router({ mergeParams: true })` for a plain router), or `:projectId` from the parent mount is invisible to validators and controllers. The same applies to `:userId` on the user-access router.
- `validateParams` only checks values. It doesn't replace `req.params`, so controllers still convert with `Number(req.params.id)`. The user-access controller reads `assignmentId` as a plain string.
- Server validation errors come back as one joined string (`"field: message; ..."`), not per field, so the frontend can't map them to fields. Keep the client schemas in sync with the backend ones. The log line `request.validation.failed` does carry the rejected field names.
- `projectRepository.findPage` and `entityRepository.findPageByProject` replaced `findAll` and `findByProject`. Check for other callers before reintroducing a full-list read.
- A restored environment keeps its old `sortOrder` and can land mid-list or tie with another. The next reorder normalizes the values.
- Mount order in `app.ts`: `requestId`, `requestLogger`, `corsMiddleware`, `diagnosisGuard`, `express.json()`, `sessionUnlessExempt`, then `router`, `notFound`, `errorHandler`. A new public or infra route that must work while `DOWN` goes in `GUARD_EXEMPT_PATHS`, which also skips the session middleware (`sessionUnlessExempt`).
- `router` is mounted at the root and carries the `/api/v1` prefix itself, so `GET /` and the API both pass through the same middleware chain.
- `isDiagnosisExempt` lives in `lib/diagnosis` (`diagnosis.exempt.ts`) because both `diagnosisGuard` and `sessionUnlessExempt` use it.
- Nothing in `lib/` may import from `@/middleware`. Middleware imports from `lib/`, never the other way round, or a circular import appears.
- Nothing in `config/` may import from `@/lib`. The logger reads `env` while it loads, so a `config/env` file that reaches the logger (even through a barrel) leaves `env` undefined and crashes at startup with `Cannot read properties of undefined (reading 'env')`. Shared values that `env.ts` needs, like `LOG_SCOPES`, live in `config/env/` as import-free files, and the logger imports them from there.
- `diagnosis.recordCycleResult` is for the scheduler only. Never call it from request code.
- Wrap every new background job or scheduled action in `guardedJob`. It also gives the run its own `traceId` for logs. A job that returns a stop function must also be added to the array passed to `registerShutdown` in `server.ts`, or it keeps running during shutdown.
- A new one-time registration that must happen before the server listens (health check, listener, handler) goes in `registerProcess` (`process/bootstrap.ts`), not in `server.ts`.
- Replayed audit rows keep their original `created_at`, so `id` order is not time order. Sort audit views by `created_at`.
- Inside `lib/diagnosis` and `lib/audit`, import from `@/lib/errors` and `@/lib/logger`, not the `@/lib` barrel, to avoid a circular import.
- Inside `config/`, import `env` from `@/config/env`, not the `@/config` barrel, so the client files never depend on the barrel that re-exports them.
- MySQL 8.4 auth cache: after a container restart the pool only reconnects with `allowPublicKeyRetrieval=true` (dev) or TLS (prod). See `docs/troubleshooting.md`. The client currently sets it for every environment.
- `TRUST_PROXY_HOPS` must match the real number of proxies in production. A wrong value lets clients spoof `req.ip` through `x-forwarded-for`.
- The seed only adds missing role permissions (`skipDuplicates`) and never overwrites existing roles. Removing a permission from `DEFAULT_ROLES` does not remove it from an existing database.
- `config/db/seed.ts` imports `lib/permissions` by relative path, like its `./seed.constants` import.
- Env defaults (port 4000, slow query 500 and 2000 ms) are written inline in the schema in `config/env/env.ts`, next to the setting they belong to. `LOG_SYNC` uses `z.stringbool()`, so `1`, `0`, `yes` and `no` are also accepted.

### Logging

- `console` is a lint error in the backend. Only the env boot error (`config/env/env.ts`) and `config/db/seed.ts` are exempt. Use `getLogger(scope)`.
- A new log scope must be added to `LOG_SCOPES` in `config/env/log-scopes.ts`. It feeds both the `LogScope` type and the validation of the `LOG_SCOPES` variable. Setting `LOG_SCOPES` in `.env` limits every scope that is not listed to `warn` and above.
- `data` accepts primitives and arrays of primitives only. Never pass user strings, bodies or objects.
- `instrument` wraps the exported functions of a service module and logs only top-level number and boolean arguments. Helpers inside a service file are not wrapped, so give them a decision snapshot line if they matter.
- `asyncHandler` takes async handlers only, so a synchronous handler stays outside it. It only records the route and forwards a rejected promise to the error handler. `getMe` is async (it loads capabilities) and goes through it.
- Middleware that runs before the error handler (`asyncHandler`, `validate*`, `requireAuth`, `authorize`, `requireSetupKey`) calls `recordRoute`. Express resets `baseUrl` before the error handler runs, so without it error lines show a partial route. `authorize` calls it itself, because the `requireAuth` that `secureRouter` mounts runs at `router.use` level, where `req.route` is not set yet.
- While `DOWN`, the guard marks its 503s and `request.finish` logs them at `warn`, so an outage doesn't create an error line per request.
- A lost audit event (DB, Redis and spool all failed) logs only `action` and `auditEventId`, never the payload, because audit metadata can hold an attempted email.

### Authorization

- Register routes with `secureRouter`, not `Router()`, unless the route is public or infra (`auth`, `health`, `diagnosis`). A plain `Router` has no declaration check. A nested secure router (entities under projects, user-access under users) runs `requireAuth()` again, so those requests read the user twice.
- A route with the `scoped` rule has no permission check, so the service must filter by the user's scope. Never register a `scoped` route whose service ignores `resolveScope`. `scoped` routes return empty results, not 403, for a user with no access. Only the entity list and `GET /projects/:id` return 404.
- Target resolvers in `requires(permission, target)` and `adminOnlyOn(target)` run before `validateParams`, so `Number(req.params.x)` can be `NaN`. For permission checks a `NaN` matches only null scope columns, so it never grants more access. For visibility it counts as hidden unless the user's scope is `all`.
- An entity target must carry its `projectId` too. An `entityId` without a `projectId` counts as hidden.
- Use `adminOnlyOn` or `adminOnlyHidden`, not `adminOnly`, on any new admin-only route that addresses one row by id. Plain `adminOnly` returns 403 for ids the user can't see, which breaks the 404 rule.
- The check runs before request validation, so a denied request never reaches the validators.
- Catalog writes are `adminOnly` today, and `withCatalogCapabilities` checks the same rule. When a catalog write moves to `requires(...)` or `adminOnlyOn(...)`, change the rule in `withCatalogCapabilities` in the same PR, or the UI will hide buttons the API would allow.
- Any new read endpoint that returns items the UI can act on must add `capabilities` with the shared helper, not its own checks.
- `user_access` foreign keys are `Restrict`, so soft-deleting a user, role, project, entity or environment leaves its access rows in place. `findActiveGrantsByUserId` ignores rows whose role, project, entity or environment is deleted, and a deleted or disabled user never reaches it because `requireAuth` rejects them first. Any new code that reads `user_access` for access decisions must do the same.

### Users and access

- `userRepository.lockById` must be the first statement in its transaction. The duplicate check relies on the lock being taken before any read, so it sees rows committed by the request it waited for.
- Every user change that deletes, disables (`isActive: false`) or demotes (`type: user`) must call `assertNotLastAdmin(tx, userId)` as the first statement of its transaction. The lock must come before any other read, like `lockById`.
- Use `findByEmailIncludingDeleted` for any uniqueness check on user emails. `findByEmail` hides deleted rows and would let a reserved email through.
- `userRepository.findPage` is the only user read that uses `select`. Its result type is `UserListItem`, not `User`. Add new list fields to `LIST_SELECT` on purpose.
- `/users/:userId/access` is mounted inside `usersRouter` (`api/v1/users`), behind its `adminOnlyHidden` rules. Add new user routes there. `api/v1/index.ts` must not also mount the access router on its own.
- `GET /access/roles` is declared `adminOnly` and returns every active role. If roles ever need to be readable by non-admins, move it to a rule that scopes the result.

### Frontend

- Tailwind classes must be written literally. Dynamic class-string construction is silently dropped by the static scanner.
- Flex children that truncate need `min-w-0` (this caused the Sidebar and Button overflow bugs).
- Tailwind v4 resets buttons to the default cursor. Interactive custom controls need an explicit `cursor-pointer`.
- `react/no-unescaped-entities` flags apostrophes in JSX text, not in string props. Reword JSX text ("cannot" instead of "can't") instead of escaping.
- `useApiQuery` needs a stable `request` reference, so wrap parameterized service calls in `useCallback` (see `useEnvironments`, `useUsers`, `EditUserForm`).
- `GET /projects`, `GET /projects/:projectId/entities` and `GET /users` return `{ items, meta }`, not an array. Screens must read `data.items`. Anything that needs every project or environment (such as the assignment form) must use `GET /access/available`, not the list: the page size is capped at 100. The entity picker in the assignment form is the exception: it reads one page of up to 100 entities for the chosen project, so a project with more entities is truncated there.
- `GET /projects/:id` returns the project even when it is deleted, for admins only. Non-admins get 404 for a deleted or out-of-scope project. The project page reads it through `useProject`, which calls this endpoint.
- The frontend `ERROR_CODES` (`shared/constants/error.ts`) must stay in sync with `backend/src/lib/errors/constants.ts`. A code missing on the frontend is not an error at runtime, but `getErrorCode` comparisons against it won't type-check.
- `Field.Select` and `Field.MultiSelect` are not input elements, so `register()` can't drive them. Inside react-hook-form, wrap them in `Controller` and pass `field.ref`, `field.value`, `field.onChange` and `field.onBlur`. `Field.Toggle` is controlled and needs `Controller` too. Access cards are plain state, not part of the react-hook-form values.
- Escape inside an open `Field.Select` or `Field.MultiSelect` must not reach the parent `Modal`. They stop propagation while their panel is open.
- `ResourceList` and `ResourceToolbar` show the "Show deleted" toggle only when `onShowDeletedChange` is passed. Users omit it and reach deleted rows through the status filter.
- Card keys in the access form (`AccessDraft.key`) are the `assignmentId` for loaded cards and a counter value for new ones. Keep them stable, because each card owns its entity query.
- `Button` renders a real `<button>` and cannot act as a link. State screens take an `action` node, so use `router.push` from a client component or a `Link` for navigation.
- `setUnauthenticated` ignores calls while the status is already `unauthenticated`, so the first reason wins and several parallel 401s don't re-render. Any new code path that logs the user out must pass the reason it wants shown.
- `app/not-found.tsx` and `app/error.tsx` are client components because they read the auth store and `reset`. A page that calls `notFound()` (the project page does for a malformed id) renders `app/not-found.tsx`.
- A page that reads one resource must check `errorCode` before `error`, or the generic `FormError` hides the state screen.

## Current state

- Done: auth (setup, login, logout, `requireAuth`/`requireAdmin`, forced password change), audit logging, health check (DB + Redis), diagnosis service (backend core, wiring, audit fallback, frontend gate, manual test matrix), backend logging (see `docs/logging.md`), shared UI kit, app shell, account menu, profile modal (untested)
- Backend refactor (in progress, reducing over-engineering): server entry split into `src/process/`, `app.ts` reduced to a list of mounts (cors and session gate extracted, root route moved into `router.ts`), middleware grouped into `app/` and `route/`, request id and diagnosis guard moved out of `lib/`, `asyncHandler` simplified and its controller logs removed, diagnosis scheduler now stopped on shutdown. Config reviewed: env schema simplified with built-in zod validators and env-only constants inlined, seed data moved to `config/db/seed.constants.ts`, `LOG_SCOPES` moved to `config/env/log-scopes.ts`, Prisma log handlers moved to `config/db/logging.ts`, connect functions no longer rewrap errors. Still to review: `request-logger`, `lib/authorization` exports, the `.instrumented` wrappers, the audit fallback chain, whether the `LOG_SCOPES` filter in `getLogger` is used, and `allowPublicKeyRetrieval` in production.
- Logging: logger core, request context, service path logging, DB and Redis logging, boundary logging for errors, validation and auth, diagnosis, audit fallback and process logging, and the `no-console` lint rule. Error responses carry `requestId`, but the frontend does not show it yet, and there is no frontend error reporting.
- Catalog (backend): environments, projects and entities have admin CRUD with soft delete, restore and audit logging. Environments also support reorder. Projects have `GET /projects/:id`. The project and entity lists are paginated (`page`, `limit`, `includeDeleted`). The seed creates `dev`, `staging` and `production`. Reads are filtered by the user's scope (R6), and writes are admin-only.
- Catalog (frontend): admin screens for environments, projects and entities (see Admin routes), built on the shared `resource-list` kit. The project and entity screens read the paginated responses and show a `Pager`, and the project page uses `GET /projects/:id`. The toolbar only has "Show deleted" so far; search and filters are not built for these screens.
- Roles (backend): permission list, `roles` and `role_permissions` tables, the seeded Viewer, Editor, Approver and Auditor roles (R1), and the admin-only `GET /access/roles` list. Role CRUD is not built yet.
- Access (backend): `user_access` table and admin endpoints to assign (R2), edit and revoke (R3) a user's access, and to list a user's assignments grouped by `assignmentId`. Assign and edit validate scope and reject duplicates under a user row lock (R4). The central check (R5) is built: routes declare `adminOnly`, `adminOnlyOn`, `adminOnlyHidden`, `scoped` or `requires(...)` through `secureRouter`, and undeclared routes are denied. The scope filter (R6) is built, and `GET /access/available` returns the user's projects and environments. Hidden resources answer 404 and forbidden actions 403 (R7), checked by hand with `docs/authorization.md`. Item capabilities on catalog reads and the overall capabilities on `GET /auth/me` are built (R8, backend part). No route uses `requires(...)` yet.
- Access (frontend, W7): the assignment cards are built into the create and edit user form (project or all with a warning, role, entities, environments, summary, add and remove). Create is a two-step form and edit is a single form. Not built: a standalone access screen.
- Users (backend): admin-only user management is complete: create with a temporary password (U1), list with pagination, search and filters (U2), edit name and type (U3), disable and enable (U4), reset password (U5), delete and restore (U6). The last-admin guard (U7) is called by U3, U4 and U6. Not built: last login in the list.
- Users (frontend, W6): the admin users screen is built, with search, type and status filters, a pager, create and reset with a one-time temporary password, edit, disable, enable, delete and restore behind confirmations, and API error states. Not built: last login in the list.
- Error and access states (frontend, W9): built. The axios interceptor handles session expiry and unreachable servers centrally, the login modal shows a "session expired" notice, the shared state screens exist (no access, not found, error), `useApiQuery` exposes `errorCode`, the project page shows the not-found state, and `app/not-found.tsx` and `app/error.tsx` are in place. `NoAccessState` is built but no screen renders it yet, because no read returns 403 today.
- Flagger area shell (W8): closed as won't do. The API already scopes everything per user. The flags UI will reuse `GET /access/available` for its project and environment pickers, keep the selection in the URL, and show an empty state when the user has no access.
- Shared frontend: `Pager`, `useDebouncedValue`, `Field.Select`, `Field.MultiSelect`, `Field.Toggle`, `Notice`, the state screens, the `xl` Modal size and the pagination types are built.
- Admin area: Audit and the dashboard are placeholders.
- Needs verification: Button and Sidebar overflow fixes, Profile modal (long names, mobile widths, change-password-from-profile flow), catalog and users screens at mobile widths, `Field.Select`, `Field.MultiSelect` and `Field.Toggle` in both themes (including inside modals), the user form at mobile widths (cards, sticky footer, step indicator), that the sidebar highlights Projects on `/admin/projects/[id]`, the state screens in both themes and at mobile widths, that the backend sends `SESSION_EXPIRED` (not only `UNAUTHENTICATED`) for an expired session, that `pnpm --filter flagger-backend verify` passes and the server starts after the `isDiagnosisExempt` and `LOG_SCOPES` moves, and that the new env schema accepts the real `.env` (`z.url` protocol checks, `z.stringbool`)

## Next

1. Verify the overflow fixes, Profile modal, and the catalog and users screens (including the new form controls, the access form and the state screens)
2. Search and filters in the resource toolbar for the other screens (client-side for environments, server-side for projects and entities)
3. Epic 4: the frontend for capabilities (R8, second part), so the UI hides actions the user cannot perform
4. Show `requestId` in frontend error toasts and in the error state, and later add frontend error reporting

## New resource checklist

Backend:

1. Prisma model + migration, and a repository
2. `api/v1/<resource>/` module with its router built on `secureRouter` and a rule declared on every route (`adminOnlyOn` or `adminOnlyHidden` for admin-only routes that address one row)
3. `capabilities` on read responses through the shared helper
4. A paginated list built on `lib/pagination` if the table can grow
5. Register in `api/v1/index.ts` (nested resources: mount under the parent router, with `mergeParams: true`)
6. Audit calls, and a scope in `LOG_SCOPES` (`config/env/log-scopes.ts`)
7. `<resource>.instrumented.ts` wrapping the service (the controller imports from it), with decision snapshot lines at outcome-changing branches

Frontend:

1. `feature/<resource>/` with the list built on `ResourceList` / `ResourceRow`, and a `Pager` plus a `*_PAGE_SIZE` constant for paginated lists
2. The matching `app/admin/<resource>/page.tsx`, with a not-found or no-access state if it reads a single resource
3. A nav entry in `ADMIN_NAV_ITEMS`
4. Any new API error code added to the frontend `ERROR_CODES`
