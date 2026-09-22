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
