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
- Frontend: Next.js App Router, Tailwind, light/dark theme tokens

## Backend structure

- `src/api/v1/<resource>/`: `.router`, `.controller`, `.service`, `.validator`, `.types`, `.constants`, `.utils`, exported via `index.ts`
- `src/repositories/<model>/`: all data access (Prisma lives here)
- `src/lib/`: cross-cutting code: `auth` (`requireAuth`, `requireAdmin`), `session`, `errors` (AppError), `audit`
- `src/middleware/`: `async-handler`, `validate` (`validateBody`, `validateParams`, `validateQuery`), `error-handler` (maps Prisma `P2002` to 409), `not-found`
- `src/config/`: env, db, redis
- Models: `User`, `SystemSetting`, `AuditLog`, `Environment`, `Project`, `Entity` (`prisma/schema.prisma`)
- `src/generated/prisma/` is auto-generated. Never edit or read it.

## Frontend structure

- `app/`: routes and layouts only (`/admin/*` is guarded)
- `feature/<name>/`: domain logic + components (`.service`, `.hook`, `.validator`, `.types`, `components/`)
- `shared/components/{ui,layout,form,feedback}/`: reusable primitives (Button, Field, Modal, Popover, Avatar, Badge, ConfirmDialog, Toast, Loader, Sidebar)
- `shared/{lib,hooks,config,theme}/`: API client, `api-query.hook`, env, theming
- App shell: sidebar + scrollable main. No navbar or footer.

## Key decisions

- **Session auth, not JWT.** Sessions live server-side in Redis. The client cookie holds only `userId` + `sessionVersion`. Bumping `sessionVersion` on password change logs out all other sessions (intentional).
- **Modals over pages** for login, forced password change, profile, and settings. Keeps one persistent shell and avoids route-guard sprawl.
- **Features don't import each other.** Duplicate tiny constants instead (documented inline where done).
- **Every auth action is audit-logged** via `lib/audit`.
- First-admin setup is one-time and key-gated.
- **Catalog keys are immutable and stay reserved.** `Environment`, `Project` and `Entity` keys can't change after creation, and the unique index covers soft-deleted rows, so a deleted key can only come back through restore. Entity keys are unique per project, and `project_id` is immutable too.
- **Entities are nested** under their project (`/projects/:projectId/entities`). Every entity route needs an active parent project (404 otherwise). Soft-deleting a project does not cascade to its entities.
- **Catalog list endpoints are admin-only for now.** R6 (non-admins see only what they can access) waits for Epic 4. Each service has a documented hook where the access filter goes, and only the GET guard gets relaxed.
- **Audit rows carry scope ids**: `project.*` sets `projectId`, `entity.*` sets `projectId` and `entityId`, `environment.*` sets `environmentId`. Environment reorder writes one `environment.updated` row per environment that moved.

## Gotchas

- Tailwind classes must be written literally. Dynamic class-string construction is silently dropped by the static scanner.
- Prisma exports model types as `<Model>Model` (e.g. `UserModel`), not the bare name.
- Flex children that truncate need `min-w-0` (this caused the Sidebar and Button overflow bugs).
- Nested routers need `Router({ mergeParams: true })`, or `:projectId` from the parent mount is invisible to validators and controllers.
- `validateParams` only checks values. It doesn't replace `req.params`, so controllers still convert with `Number(req.params.id)`.

## Current state

- Done: auth (setup, login, logout, `requireAuth`/`requireAdmin`, forced password change), audit logging, health check (DB + Redis), shared UI kit, app shell, account menu, profile modal (untested)
- Catalog (backend): environments, projects and entities have admin CRUD with soft delete, restore and audit logging. Environments also support reorder. The seed creates `dev`, `staging` and `production`. R6 is not implemented yet.
- Admin area (frontend): scaffolded with route guard. Users, Projects, Environments, and Audit pages are placeholders.
- Needs verification: Button and Sidebar overflow fixes, Profile modal (long names, mobile widths, change-password-from-profile flow)

## Next

1. Verify the overflow fixes and Profile modal
2. Frontend for the catalog: Environments, Projects and Entities admin pages
3. Epic 4 (roles/access scoping), then R6 on the three list endpoints

## New resource checklist

Prisma model + migration, repository, `api/v1/<resource>/` module, register in `api/v1/index.ts` (nested resources: mount under the parent router, with `Router({ mergeParams: true })`), audit calls, then `feature/<resource>/` on the frontend and the matching `app/admin/<resource>/page.tsx`.
