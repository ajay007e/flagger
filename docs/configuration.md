# Configuration

## Where each file lives

| File                  | Used by                    | Committed?               |
| --------------------- | -------------------------- | ------------------------ |
| `.env` (repo root)    | `docker-compose.yml`       | No (`.env.example` is)   |
| `backend/.env`        | The backend and Prisma CLI | No (`.env.example` is)   |
| `frontend/.env`       | The frontend               | Yes, defaults only       |
| `frontend/.env.local` | The frontend               | No, your local overrides |

## Backend (`backend/.env`)

The backend validates every variable when it starts. If any is missing or invalid it prints the variable names and reasons (never the values) and exits.

| Variable              | Required       | Default       | Description                                                                                |
| --------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------ |
| `NODE_ENV`            | No             | `development` | `development`, `test`, or `production`                                                     |
| `PORT`                | No             | `4000`        | Port the API listens on (1 to 65535)                                                       |
| `DATABASE_URL`        | Yes            |               | MySQL connection, must start with `mysql://`                                               |
| `SHADOW_DATABASE_URL` | For migrations |               | Shadow database for `prisma migrate dev`. Read by the Prisma CLI, not validated by the app |
| `REDIS_URL`           | Yes            |               | Redis connection, must start with `redis://` or `rediss://`                                |
| `SESSION_SECRET`      | Yes            |               | Signs session cookies, at least 32 characters                                              |
| `ALLOWED_ORIGINS`     | Yes            |               | Comma-separated frontend origins allowed by CORS                                           |
| `SETUP_API_KEY`       | Yes            |               | Key required to create the first admin, at least 32 characters                             |

Rules:

- **Secrets:** generate them with `openssl rand -hex 32`. In production the server rejects secrets that still start with `change-me` (the placeholders in `.env.example`).
- **`ALLOWED_ORIGINS`:** each entry must be `http(s)://host[:port]` with no path and no trailing slash, and `*` is not allowed. Example: `http://localhost:3000,https://app.example.com`.
- **Reading values in code:** import `env` from `@/config`. Do not read `process.env` directly. The one exception is `prisma.config.ts`, which only runs in the Prisma CLI.
- Never commit `.env` files or print secrets in logs.

## Frontend

| Variable              | Default                 | Description                                                                             |
| --------------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Where the backend lives. It is sent to the browser, so it must be reachable from there. |

## Docker Compose (root `.env`)

Optional. Every value has a default. See [docker.md](./docker.md).

| Variable              | Default   |
| --------------------- | --------- |
| `MYSQL_ROOT_PASSWORD` | `root`    |
| `MYSQL_DATABASE`      | `flagger` |
| `MYSQL_USER`          | `flagger` |
| `MYSQL_PASSWORD`      | `flagger` |
| `MYSQL_PORT`          | `3306`    |
| `REDIS_PORT`          | `6379`    |

If you change these, update the URLs in `backend/.env` to match.
