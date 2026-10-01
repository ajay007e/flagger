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
- `src/lib/`: cross-cutting code: `auth`, `session`, `errors` (AppError), `audit`
- `src/middleware/`: `async-handler`, `validate`, `error-handler`, `not-found`
- `src/config/`: env, db, redis
- Models: `User`, `SystemSetting`, `AuditLog` (`prisma/schema.prisma`)
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

## Gotchas

- Tailwind classes must be written literally. Dynamic class-string construction is silently dropped by the static scanner.
- Prisma exports model types as `<Model>Model` (e.g. `UserModel`), not the bare name.
- Flex children that truncate need `min-w-0` (this caused the Sidebar and Button overflow bugs).

## Current state

- Done: auth (setup, login, logout, `requireAuth`/`requireAdmin`, forced password change), audit logging, health check (DB + Redis), shared UI kit, app shell, account menu, profile modal (untested)
- Admin area: scaffolded with route guard. Users, Projects, Environments, and Audit pages are placeholders.
- Needs verification: Button and Sidebar overflow fixes, Profile modal (long names, mobile widths, change-password-from-profile flow)

## Next

1. Verify the overflow fixes and Profile modal
2. C1: Environments (admin CRUD): schema, repository, API, audit wiring
3. C2/C3: Projects and Entities, same pattern, then Epic 4 (roles/access scoping)

## New resource checklist

Prisma model + migration, repository, `api/v1/<resource>/` module, register in `api/v1/index.ts`, audit calls, then `feature/<resource>/` on the frontend and the matching `app/admin/<resource>/page.tsx`.
