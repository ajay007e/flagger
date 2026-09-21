# Flagger

A lightweight feature flag service with a web UI, backend API, and documentation.

Flagger lets you turn features on or off, roll them out gradually, and manage everything from a simple dashboard, without redeploying your apps.

> **Status:** Early development. Things will change.

## Features (planned)

- Create, update, and delete feature flags
- Enable or disable flags per environment (e.g. dev, staging, production)
- Percentage-based rollouts
- REST API for evaluating flags from any application
- Web dashboard for managing flags
- API key authentication

## Tech Stack

| Part     | Technologies                      |
| -------- | --------------------------------- |
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend  | Node.js, Express, TypeScript      |

## Project Structure

```
flagger/
├── frontend/   # Next.js dashboard
├── backend/    # Express API
├── docs/       # Project documentation
└── README.md
```

## Requirements

- [Node.js](https://nodejs.org/) v18 or later
- [pnpm](https://pnpm.io/) v8 or later (`npm install -g pnpm` or `corepack enable`)
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) with Docker Compose (for local MySQL and Redis)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ajay007e/flagger.git
cd flagger
```

### 2. Set up the backend

```bash
cd backend
pnpm install
cp .env.example .env   # then edit values as needed
pnpm dev
```

The API will run on `http://localhost:4000` by default.

### 3. Set up the frontend

In a new terminal:

```bash
cd frontend
pnpm install
cp .env.example .env.local   # then edit values as needed
pnpm dev
```

The dashboard will run on `http://localhost:3000`.

## Local Services (MySQL and Redis)

The backend uses MySQL and Redis. Start both with Docker Compose from the repo root:

```bash
docker compose up -d     # start in the background
docker compose ps        # check status (both should be "healthy")
docker compose down      # stop, data is kept
docker compose down -v   # stop and delete all data
```

Shortcuts: `pnpm services:up`, `pnpm services:down`, `pnpm services:logs`, `pnpm services:reset`.

| Service | Address          | Details                                                |
| ------- | ---------------- | ------------------------------------------------------ |
| MySQL   | `localhost:3306` | database `flagger`, user `flagger`, password `flagger` |
| Redis   | `localhost:6379` | append-only persistence enabled                        |

Both ports are bound to `127.0.0.1` only. These credentials are for local development only.

MySQL also gets a `flagger_shadow` database on first start, which Prisma uses for migrations. Init scripts only run when the data volume is first created, so use `docker compose down -v` to re-run them.

### Changing ports or credentials

Copy `.env.example` to `.env` in the repo root, edit the values, and restart the services. Then update `DATABASE_URL`, `SHADOW_DATABASE_URL`, and `REDIS_URL` in `backend/.env` to match.

## Database and Migrations

The backend uses [Prisma ORM](https://www.prisma.io/) (pinned to v7, the line that supports MySQL) with MySQL. Run these from `backend/` while the services are running (`pnpm services:up`):

```bash
pnpm db:generate                       # generate the Prisma Client (also runs on pnpm install)
pnpm db:deploy                         # apply all committed migrations (use on a fresh database)
pnpm db:migrate --name add_something   # create and apply a new migration after editing the schema
pnpm db:seed                           # run the seed script (safe to run repeatedly)
```

### Changing the schema

1. Edit `backend/prisma/schema.prisma`.
2. Run `pnpm db:migrate --name <short_description>` and review the generated SQL in `backend/prisma/migrations/`.
3. Run `pnpm db:generate` to refresh the client types.
4. Commit the schema change and the new migration folder together.

### Notes

- The generated client lives in `backend/src/generated/prisma` and is not committed.
- Prisma 7 does not run `generate` or the seed script after `migrate dev`, so run them yourself.
- `migrate dev` uses the shadow database from `SHADOW_DATABASE_URL`, which the compose init script creates.
- Never edit a migration that has been applied or merged. Add a new one instead.
- After the first `pnpm install`, run `pnpm approve-builds` and allow the Prisma packages, then commit the change it makes.

## Documentation

Guides and API references live in the [`docs/`](./docs) folder.

## Contributing

This is a hobby project, but suggestions and pull requests are welcome. Feel free to open an issue to start a discussion.

## License

Released under the [MIT License](./LICENSE).
