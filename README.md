# Flagger

A lightweight feature flag service with a web UI, a backend API, and documentation.

> **Status:** early development, so expect changes. Progress is tracked in the GitHub milestones (Epic 0 to Epic 6).

## What it will do

- Manage feature flags per project, entity, and environment
- Two interfaces: an admin UI (users, access, configuration) and the Flagger UI (flags)
- Fine-grained access control, so people only see and change what they are allowed to
- An audit log of every action in the service
- An approval workflow for flag changes (later)
- A REST API for applications to read flags (later)

## Tech stack

| Part     | Technologies                                      |
| -------- | ------------------------------------------------- |
| Frontend | Next.js, TypeScript, Tailwind CSS                 |
| Backend  | Node.js, Express, TypeScript, Prisma              |
| Data     | MySQL, Redis                                      |
| Tooling  | pnpm workspaces, Docker Compose, ESLint, Prettier |

## Project structure

```
flagger/
├── frontend/             # Next.js app          (see frontend/README.md)
├── backend/              # Express API          (see backend/README.md)
├── docs/                 # Project documentation
├── scripts/              # Helper scripts (MySQL init, GitHub issue creation)
├── docker-compose.yml    # Local MySQL and Redis
├── pnpm-workspace.yaml
└── package.json          # Root scripts
```

## Quick start

You need Node.js 20.19+, pnpm 10+, Docker, and Git. Full steps are in [docs/installation.md](./docs/installation.md).

```bash
git clone https://github.com/ajay007e/flagger.git
cd flagger

pnpm install
pnpm approve-builds                       # first time only
pnpm services:up                          # MySQL and Redis

cp backend/.env.example backend/.env      # then set SESSION_SECRET and SETUP_API_KEY
cd backend && pnpm db:deploy && cd ..     # create the tables

pnpm dev                                  # frontend and backend together
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000 (health check at `/api/health`)

## Documentation

| Document                                     | What is in it                             |
| -------------------------------------------- | ----------------------------------------- |
| [Installation](./docs/installation.md)       | Prerequisites and step-by-step setup      |
| [Docker services](./docs/docker.md)          | Running MySQL and Redis locally           |
| [Database](./docs/database.md)               | Prisma, migrations, seeding               |
| [Configuration](./docs/configuration.md)     | Every environment variable                |
| [Development guide](./docs/development.md)   | Scripts, conventions, Git workflow        |
| [API errors](./docs/api-errors.md)           | The error format and codes                |
| [Theming](./docs/theming.md)                 | Light and dark themes, adding custom ones |
| [Troubleshooting](./docs/troubleshooting.md) | Fixes for common problems                 |

Each app also has its own README: [frontend](./frontend/README.md) and [backend](./backend/README.md).

## Contributing

This is a hobby project, but suggestions and pull requests are welcome. Please read the [development guide](./docs/development.md) first, and open an issue to start a discussion.

## License

Released under the [MIT License](./LICENSE).
