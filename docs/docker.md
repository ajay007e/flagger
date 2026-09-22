# Docker services

`docker-compose.yml` at the repo root runs the services the backend needs. It is for local development only.

## Services

| Service | Image            | Address          | Notes                                                                         |
| ------- | ---------------- | ---------------- | ----------------------------------------------------------------------------- |
| MySQL   | `mysql:8.4`      | `localhost:3306` | Database `flagger`, user `flagger`, password `flagger`. UTF-8, UTC time zone. |
| Redis   | `redis:7-alpine` | `localhost:6379` | Append-only persistence, so sessions survive a restart.                       |

Both ports are bound to `127.0.0.1` only, so they are not reachable from your network. Both services have healthchecks and use named volumes (`flagger_mysql_data`, `flagger_redis_data`).

## Commands

Run from the repo root.

| Command                  | Shortcut              | What it does                      |
| ------------------------ | --------------------- | --------------------------------- |
| `docker compose up -d`   | `pnpm services:up`    | Start in the background           |
| `docker compose ps`      |                       | Show status (look for "healthy")  |
| `docker compose logs -f` | `pnpm services:logs`  | Follow the logs                   |
| `docker compose down`    | `pnpm services:down`  | Stop, data is kept                |
| `docker compose down -v` | `pnpm services:reset` | Delete all data, then start again |

Open a shell in a service:

```bash
docker exec -it flagger-mysql mysql -uflagger -pflagger flagger
docker exec -it flagger-redis redis-cli
```

## Changing ports or credentials

1. Copy `.env.example` to `.env` in the repo root and edit it:

   ```env
   MYSQL_ROOT_PASSWORD=root
   MYSQL_DATABASE=flagger
   MYSQL_USER=flagger
   MYSQL_PASSWORD=flagger
   MYSQL_PORT=3306
   REDIS_PORT=6379
   ```

2. Restart the services.
3. Update `DATABASE_URL`, `SHADOW_DATABASE_URL`, and `REDIS_URL` in `backend/.env` to match. For example, with `MYSQL_PORT=3307`:

   ```env
   DATABASE_URL="mysql://flagger:flagger@localhost:3307/flagger"
   SHADOW_DATABASE_URL="mysql://flagger:flagger@localhost:3307/flagger_shadow"
   ```

Database and user names only apply when the volume is first created. To change them later, run `pnpm services:reset`, which deletes the data.

## The shadow database

On the first start, `scripts/mysql/01-shadow-database.sh` creates a `flagger_shadow` database and gives the app user access to it. Prisma's `migrate dev` needs it (see [database.md](./database.md)).

MySQL only runs the scripts in that folder when the data volume is first created. If you started MySQL before the script existed, run `pnpm services:reset`. Never mount the whole `scripts/` folder into MySQL, because it would try to run every script in it.

## Port already in use

If another MySQL is using port 3306 (for example from another project), pick a different port as described above. See [troubleshooting.md](./troubleshooting.md).
