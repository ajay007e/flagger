# Installation

## Prerequisites

| Tool    | Version      | Why                                                    |
| ------- | ------------ | ------------------------------------------------------ |
| Node.js | 20.19+       | Required by Prisma 7                                   |
| pnpm    | 10+          | Package manager (`corepack enable` or `npm i -g pnpm`) |
| Docker  | with Compose | Runs MySQL and Redis locally                           |
| Git     | any          |                                                        |

## Steps

### 1. Clone and install

```bash
git clone https://github.com/ajay007e/flagger.git
cd flagger
pnpm install
```

One install at the root covers the frontend and the backend (they are pnpm workspaces).

### 2. Approve build scripts (first time only)

pnpm 10 blocks install scripts until you allow them:

```bash
pnpm approve-builds
```

Select the packages it lists (`prisma`, `@prisma/engines`, `esbuild`, `unrs-resolver`, and `@prisma/client` if shown). pnpm saves the choice in the workspace config, so commit that change. Then run `pnpm install` once more if you approved after installing.

### 3. Start MySQL and Redis

```bash
pnpm services:up
docker compose ps        # wait until both are "healthy"
```

More in [docker.md](./docker.md).

### 4. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and replace the two placeholders with real secrets:

```bash
openssl rand -hex 32     # run twice: one for SESSION_SECRET, one for SETUP_API_KEY
```

If you changed MySQL or Redis ports or credentials, update `DATABASE_URL`, `SHADOW_DATABASE_URL`, and `REDIS_URL` to match. All variables are explained in [configuration.md](./configuration.md).

The frontend needs no setup: `frontend/.env` already points at `http://localhost:4000`.

### 5. Create the database tables

```bash
cd backend
pnpm db:deploy           # apply the committed migrations
pnpm db:seed             # insert default data
cd ..
```

More in [database.md](./database.md).

### 6. Run the apps

```bash
pnpm dev                 # frontend and backend together
```

| App      | URL                              |
| -------- | -------------------------------- |
| Frontend | http://localhost:3000            |
| Backend  | http://localhost:4000            |
| Health   | http://localhost:4000/api/health |

The navbar of the frontend should show "API online". If it does not, see [troubleshooting.md](./troubleshooting.md).

## Next steps

- [Development guide](./development.md) for scripts and conventions
- [Troubleshooting](./troubleshooting.md) if something fails
