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

## Documentation

Guides and API references live in the [`docs/`](./docs) folder.

## Contributing

This is a hobby project, but suggestions and pull requests are welcome. Feel free to open an issue to start a discussion.

## License

Released under the [MIT License](./LICENSE).
