# Flagger frontend

The web UI for Flagger, built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Getting started

The backend must be running for the API status in the navbar to show "online". From the repo root:

```bash
pnpm dev:frontend      # or, inside frontend/: pnpm dev
```

Open http://localhost:3000.

## Scripts

| Script                              | What it does                |
| ----------------------------------- | --------------------------- |
| `pnpm dev`                          | Start the dev server        |
| `pnpm build` / `pnpm start`         | Production build and server |
| `pnpm typecheck`                    | Type-check without emitting |
| `pnpm lint` / `pnpm lint:fix`       | Run ESLint                  |
| `pnpm format` / `pnpm format:check` | Run Prettier                |

## Environment

| Variable              | Purpose                 | Default                 |
| --------------------- | ----------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Where the backend lives | `http://localhost:4000` |

`.env` holds the committed defaults. `.env.local` is for your own overrides and is not committed. See [docs/configuration.md](../docs/configuration.md).

## Structure

```
frontend/
├── app/         # Routes, root layout, global styles
├── feature/     # One folder per feature (for example health)
└── shared/      # Code used across the app
    ├── components/   # Button, Navbar, Footer
    ├── config/       # Environment values and app constants
    ├── constants/  # Global constants (API error codes)
    ├── hooks/        # useApiQuery
    ├── lib/          # axios client, error helpers, cn()
    ├── theme/        # Theme provider, script, switcher, colors
    └── types/      # Global types (API response shapes)
```

## Conventions

- **Barrel files:** each folder exposes its public API through an `index.ts`. Import from `@/shared/theme`, not from a file inside it. Inside the same folder, use relative imports to avoid circular imports.
- **Types and constants:** keep them in a `types.ts` and `constants.ts` next to the code that uses them. Move them to `shared/` only when several areas need them.
- **Colors:** use theme tokens (`bg-background`, `text-muted`, `border-border`), never hardcoded colors, so every theme works.
- **Features** never import from each other. Shared code never imports from a feature.

## More

- [Theming](../docs/theming.md)
- [API errors](../docs/api-errors.md)
- [Development guide](../docs/development.md)
