# Development guide

## Workspace commands

The repo is a pnpm workspace with two packages: `flagger-frontend` and `flagger-backend`. Run these from the repo root.

| Command                             | What it does                        |
| ----------------------------------- | ----------------------------------- |
| `pnpm dev`                          | Start frontend and backend together |
| `pnpm dev:frontend`                 | Start only the frontend             |
| `pnpm dev:backend`                  | Start only the backend              |
| `pnpm build`                        | Build both apps                     |
| `pnpm typecheck`                    | Type-check both apps                |
| `pnpm lint` / `pnpm lint:fix`       | Run ESLint in both apps             |
| `pnpm format` / `pnpm format:check` | Run Prettier in both apps           |
| `pnpm services:up`                  | Start MySQL and Redis               |
| `pnpm services:down`                | Stop them                           |
| `pnpm services:logs`                | Follow their logs                   |
| `pnpm services:reset`               | Delete their data and start again   |

Run a script in one app: `pnpm --filter flagger-backend <script>` (or run it inside that folder). Add a dependency the same way: `pnpm --filter flagger-frontend add <package>`.

## Code conventions

### Types and constants

Keep them in a `types.ts` and `constants.ts` next to the code that uses them. When several areas need one, move it to `frontend/shared/` (or the equivalent in the backend).

### Frontend

- Folders: `app/` (routes), `feature/<name>/` (one feature), `shared/` (used across features).
- Each folder exposes its public API through an `index.ts` (a barrel). Import from the folder (`@/shared/theme`), not from a file inside it.
- Inside the same folder, use relative imports so you never import through your own barrel.
- Shared code never imports from a feature, and features do not import each other. Compose them in `app/` (for example the navbar takes the health status as `children`).
- File names describe the role: `theme.provider.tsx`, `health.service.ts`, `health.hook.ts`, `button.styles.ts`.
- Files that use JSX need the `.tsx` extension.
- Use theme tokens for colors, see [theming.md](./theming.md).

### Backend

- Configuration only through `@/config`.
- Database access only through `@/db`.
- Throw `AppError` for errors the client may see, wrap async handlers in `asyncHandler`, and validate bodies with `validateBody`. See [api-errors.md](./api-errors.md).
- Migrations follow the rules in [database.md](./database.md).

### Formatting and linting

Prettier and ESLint run per app. Both have configs in each app folder. Generated code (`backend/src/generated`) is ignored.

## Git workflow

- **Branches:** `feature/<ticket>-<short-description>`, for example `feature/f2-add-docker-compose`.
- **Commits:** Conventional Commits, for example `feat(backend): add standard error contract` or `chore: add docker-compose`.
- **Pull requests:** use the template in `.github/pull_request_template.md` (What, Changes, How to test, Notes). The last item under Notes is `Closes #<issue number>`.
- **Issues:** work is tracked in GitHub issues grouped into milestones, Epic 0 (Foundation) to Epic 6 (Frontend).
