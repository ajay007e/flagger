# Troubleshooting

## Port 3306 is already in use

`docker compose up` fails with "address already in use". Another MySQL (often from another project) holds the port. Check what uses it:

```bash
sudo lsof -i :3306
```

Either stop the other MySQL, or move Flagger to another port: set `MYSQL_PORT=3307` in the root `.env`, update `DATABASE_URL` and `SHADOW_DATABASE_URL` in `backend/.env` to use `3307`, then `docker compose down` and `docker compose up -d`. See [docker.md](./docker.md).

## ESLint cannot find a plugin

```
ESLint couldn't find the plugin "eslint-plugin-react-hooks"
```

pnpm only lets a package import what it declares, and ESLint loads config plugins from the project folder. The root `.npmrc` hoists ESLint and Prettier packages to fix this:

```
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*
```

After adding or changing it, run `pnpm install` again (pnpm may ask to recreate `node_modules`, answer yes).

## The backend exits with "Invalid environment configuration"

A variable in `backend/.env` is missing or invalid. The message lists the names and reasons. Compare your file with `backend/.env.example` and see [configuration.md](./configuration.md).

If you appended lines to `.env` from the terminal and it still fails, the file may have had no final newline, which glues the new line onto the old one. Open the file and check that each variable is on its own line.

## "Could not connect to MySQL"

- Is MySQL running? `docker compose ps` should show `healthy`. Start it with `pnpm services:up`.
- Does `DATABASE_URL` use the right port and credentials? They must match the root `.env` (or the defaults).
- Look for `db.connect.failed` (or `redis.connect.failed`) in the backend log. The `err` field has the error type and code.

The server no longer exits when MySQL is down. It starts, stays `DOWN`, and returns 503 until MySQL is reachable. See [diagnosis.md](./diagnosis.md).

## The system stays DOWN after MySQL restarts

The backend log shows `pool timeout ... (pool connections: active=0 idle=0)` on every cycle, even though MySQL is healthy. MySQL 8.4 uses `caching_sha2_password`, and its auth cache is empty after a restart. Without TLS the driver can't complete the full authentication, so it can never open a connection.

- Development: `config/db/client.ts` sets `allowPublicKeyRetrieval=true`. Check it is still there.
- Production: use TLS (`ssl=true` and trust the CA) instead.
- To confirm: `docker run --rm --network host mysql:8.4 mysql -h127.0.0.1 -P3307 -uflagger -pflagger flagger --ssl-mode=DISABLED -e "select 1"` fails with "Authentication requires secure connection".
- Running a login inside the container (`docker exec ... mysql`) fills the cache and appears to fix it. That is a symptom, not a fix. Don't do it when testing recovery.

## The "Service unavailable" modal doesn't go away

The frontend only reflects the backend. Run `curl -s localhost:4000/api/v1/diagnosis`:

- Still `DOWN`: a dependency is failing. Check the backend log for the latest `diagnosis.status.changed` line (its `data.reason`) and the `health.check.failed` lines before it and `docker compose ps`.
- `UP`, but the modal stays: reload the page. The poll runs every 5 s while the modal shows.

Recovery takes about 15 to 30 s after a dependency is healthy (one scheduler cycle).

## Find out what happened to a failed request

Take the `requestId` from the error response body (or the `x-request-id` response header) and search the logs for it:

```bash
jq 'select(.requestId == "<id>")' app.log
```

You get the whole path of that request: start, controller, service, queries (at `trace`), the error, and the finish line. Match an audit row by its `request_id`. See [logging.md](./logging.md).

## The logs are too noisy, or lines are missing

- Too noisy: raise `LOG_LEVEL` to `info` or `warn`, or set `LOG_SCOPES` to the areas you care about. Other scopes then log `warn` and above only. Restart the backend after changing either.
- Lines missing: `controller.*` and health check results are `debug`, and SQL is `trace`. Lower `LOG_LEVEL` to see them.
- Redis errors repeating every few seconds while Redis is down is expected: the client reports every failed retry.

## Cannot find `@/generated/prisma/client`

The Prisma Client has not been generated yet:

```bash
cd backend
pnpm db:generate
```

It normally runs after `pnpm install`. If you approved build scripts late, run it yourself.

## "Ignored build scripts" after `pnpm install`

pnpm 10 blocks install scripts until you allow them. Run `pnpm approve-builds`, select the packages it lists, and commit the change. See [installation.md](./installation.md).

## The shadow database does not exist

`prisma migrate dev` fails because `flagger_shadow` is missing. The init script only runs when the MySQL volume is first created. Recreate it (this deletes the data):

```bash
pnpm services:reset
```

## The navbar shows "API offline"

- Is the backend running on the port in `NEXT_PUBLIC_API_URL`? Open http://localhost:4000/api/health.
- The browser calls the backend directly, so `ALLOWED_ORIGINS` in `backend/.env` must include the frontend's origin (`http://localhost:3000`).
- Hover the status pill to see the message from the backend.
