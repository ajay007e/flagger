# Database

The backend uses **MySQL** through **Prisma ORM**, pinned to version 7. Prisma 8 does not support MySQL yet, and Prisma's own documentation points to version 7 for MySQL, so a later move to 8 will need a migration.

## Layout

```
backend/
├── prisma/
│   ├── schema.prisma          # The data model
│   └── migrations/            # Committed SQL migrations (one folder each)
├── prisma.config.ts           # Database URLs, migrations path, seed command
└── src/
    ├── db/
    │   ├── client.ts          # The shared Prisma client
    │   ├── constants.ts       # Default seed data
    │   ├── seed.ts            # Seed script
    │   └── index.ts
    └── generated/prisma/      # Generated client (not committed)
```

Always import the client from `@/db`:

```ts
import { prisma } from "@/db";
```

## Commands

Run from `backend/` while MySQL is running.

| Command                         | What it does                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| `pnpm db:generate`              | Generate the Prisma Client (also runs after `pnpm install`)                             |
| `pnpm db:deploy`                | Apply all committed migrations. Use this on a fresh database, in CI, and in production. |
| `pnpm db:migrate --name <name>` | Create a new migration from schema changes and apply it (development only)              |
| `pnpm db:seed`                  | Insert default data. Safe to run repeatedly.                                            |

Prisma 7 does not run `generate` or the seed script after `migrate dev`, so run them yourself.

## Changing the schema

1. Edit `backend/prisma/schema.prisma`.
2. Run `pnpm db:migrate --name <short_description>`.
3. Open the new `backend/prisma/migrations/<timestamp>_<name>/migration.sql` and check the SQL.
4. Run `pnpm db:generate` to refresh the client types.
5. Commit the schema change and the new migration folder together.

## Sharing migrations

Migrations are plain SQL files in git, so everyone gets the same database:

- After cloning (or pulling new migrations), run `pnpm db:deploy`. It applies only the migrations that have not run yet, in order, and records them in the `_prisma_migrations` table.
- Commit the whole `prisma/migrations` folder, including `migration_lock.toml`.
- **Never edit a migration that has been applied or merged.** Prisma reports it as changed. Add a new migration instead.
- Use `db:deploy` in CI and production, never `db:migrate`.
- If two branches both add migrations, merge them, run `pnpm db:deploy`, and check that the schema still matches. If your local database gets out of step, reset it (below).

Prisma names each migration folder with a timestamp and the name you give it. The location can be changed in `prisma.config.ts`, but the folder-per-migration layout is fixed.

## Start over locally

```bash
pnpm services:reset       # from the repo root: deletes the data and restarts MySQL
cd backend
pnpm db:deploy
pnpm db:seed
```

## Tables

### `system_settings`

A key/value table for system information and, later, system preferences.

| Column                                   | Notes                                                   |
| ---------------------------------------- | ------------------------------------------------------- |
| `setting_key`                            | Primary key, for example `name`                         |
| `value`                                  | JSON, so a setting can be text, a number, or a boolean  |
| `updated_by`                             | Id of the user who last changed it (no foreign key yet) |
| `created_at`, `updated_at`, `deleted_at` | Timestamps in UTC, `DATETIME(3)`                        |

The seed script upserts `name = "Flagger"`. It never overwrites an existing value, so running it again is safe.

## Conventions

- New tables include `updated_by`, `created_at`, `updated_at`, and `deleted_at`.
- Timestamps are `DATETIME(3)` in UTC.
- Field names are camelCase in Prisma and mapped to snake_case columns with `@map`, and tables are named with `@@map`.
- Use `Int @db.UnsignedInt` for ids (Prisma returns `BigInt` as a JavaScript `bigint`, which cannot be sent as JSON).
