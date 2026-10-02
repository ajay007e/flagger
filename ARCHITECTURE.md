# Flagger: Architecture

Flagger is a full-stack feature flag system (backend + frontend) with extra features built to showcase engineering skill: granular permissions, admin and normal users, a rule engine, a diagnosis service, and multi-eye approval flows.

## Planned features

- Granular permissions (Epic 4: roles and access scoping)
- Admin and normal user areas
- Rule engine (flag targeting and evaluation rules)
- Diagnosis service
- Approval flow with multi-eye (multiple approver) sign-off

## Stack

- Monorepo: pnpm workspace (`backend/`, `frontend/`, `docs/`)
- Backend: Express + TypeScript, Prisma + MySQL, Redis sessions (`connect-redis` + `redis` client; not `ioredis`)
- Frontend: Next.js App Router, Tailwind, light/dark theme tokens, react-hook-form + zod

## Backend structure

- `src/api/v1/<resource>/`: `.router`, `.controller`, `.service`, `.validator`, `.types`, `.constants`, `.utils`, exported via `index.ts`
- `src/repositories/<model>/`: all data access (Prisma lives here)
- `src/lib/`: cross-cutting code: `auth` (`requireAuth`, `requireAdmin`), `session`, `errors` (AppError), `audit`
- `src/middleware/`: `async-handler`, `validate` (`validateBody`, `validateParams`, `validateQuery`), `error-handler` (maps Prisma `P2002` to 409), `not-found`
- `src/config/`: env, db, redis
- Models: `User`, `SystemSetting`, `AuditLog`, `Environment`, `Project`, `Entity` (`prisma/schema.prisma`)
- `src/generated/prisma/` is auto-generated. Never edit or read it.

## Frontend structure

- `app/`: routes and layouts only (`/admin/*` is guarded; the admin layout also sets page padding and max width)
- `feature/<name>/`: domain logic + components (`.service`, `.hook`, `.validator`, `.types`, `.constants`, `components/`, exported via `index.ts`)
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
- **Environment order** is set with `PUT /environments/order`, which takes every active id exactly once and returns the full active list. The UI uses up/down buttons (no drag-and-drop dependency, works on mobile and by keyboard).
- **Form errors:** invalid input shows inline per field (client zod schema mirrors the server). A `CONFLICT` response is shown on the key field. Any other failure is a form-level `FormError` banner. Delete, restore and reorder failures are toasts via `useAction`.

## Gotchas

- Tailwind classes must be written literally. Dynamic class-string construction is silently dropped by the static scanner.
- Prisma exports model types as `<Model>Model` (e.g. `UserModel`), not the bare name.
- Flex children that truncate need `min-w-0` (this caused the Sidebar and Button overflow bugs).
- Nested routers need `Router({ mergeParams: true })`, or `:projectId` from the parent mount is invisible to validators and controllers.
- `validateParams` only checks values. It doesn't replace `req.params`, so controllers still convert with `Number(req.params.id)`.
- Server validation errors come back as one joined string (`"field: message; ..."`), not per field, so the frontend can't map them to fields. Keep the client schemas in sync with the backend ones.
- There is no `GET /projects/:id`. The project page finds its project in the full list (deleted included).
- A restored environment keeps its old `sortOrder` and can land mid-list or tie with another. The next reorder normalizes the values.
- `useApiQuery` needs a stable `request` reference, so wrap parameterized service calls in `useCallback` (see `useEnvironments`).

## Current state

- Done: auth (setup, login, logout, `requireAuth`/`requireAdmin`, forced password change), audit logging, health check (DB + Redis), shared UI kit, app shell, account menu, profile modal (untested)
- Catalog (backend): environments, projects and entities have admin CRUD with soft delete, restore and audit logging. Environments also support reorder. The seed creates `dev`, `staging` and `production`. R6 is not implemented yet.
- Catalog (frontend): admin screens for environments, projects and entities (see Admin routes), built on the shared `resource-list` kit. The toolbar only has "Show deleted" so far; search and filters are not built.
- Admin area: Users, Audit and the dashboard are placeholders.
- Needs verification: Button and Sidebar overflow fixes, Profile modal (long names, mobile widths, change-password-from-profile flow), catalog screens at mobile widths, and that the sidebar highlights Projects on `/admin/projects/[id]`

## Next

1. Verify the overflow fixes, Profile modal and catalog screens
2. Search and filters in the resource toolbar (client-side first, since the lists are small)
3. Epic 4 (roles/access scoping), then R6 on the three list endpoints

## New resource checklist

Prisma model + migration, repository, `api/v1/<resource>/` module, register in `api/v1/index.ts` (nested resources: mount under the parent router, with `Router({ mergeParams: true })`), audit calls, then `feature/<resource>/` on the frontend (build the list on `ResourceList` / `ResourceRow`) and the matching `app/admin/<resource>/page.tsx`.
