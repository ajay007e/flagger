# Sessions

Sessions are stored in Redis using `express-session` and `connect-redis`, not in a database table and not signed-only cookies.

## What is stored

Only two fields ever go into a session:

```ts
interface SessionData {
  userId: number;
  sessionVersion: number;
}
```

No roles, permissions, or profile data. Those are loaded fresh from MySQL on every request (added in A4), so disabling a user or changing their access takes effect immediately, without touching Redis.

`sessionVersion` exists because Redis has no way to look up "every session belonging to user 5". It is bumped on password change or reset (A6), so a mismatch between the session's version and the user's current version logs that session out on its next request, even though the session itself still exists in Redis.

## Configuration

| Setting          | Value                                                                       |
| ---------------- | --------------------------------------------------------------------------- |
| Cookie name      | `flagger.sid` (not the `connect.sid` default)                               |
| Redis key prefix | `flagger:sess:`                                                             |
| TTL              | 7 days, refreshed on every request (`rolling: true`)                        |
| `httpOnly`       | Always on                                                                   |
| `secure`         | On in production only (requires HTTPS)                                      |
| `sameSite`       | `lax`                                                                       |
| `trust proxy`    | Enabled in production, required for `secure` cookies behind a reverse proxy |

Source: `backend/src/session/`.

## CORS

Cookies are cross-site between `localhost:3000` and `localhost:4000` in development, so:

- The backend's CORS only allows origins listed in `ALLOWED_ORIGINS` (see [configuration.md](./configuration.md)) and sets `credentials: true`.
- The frontend's axios client (`frontend/shared/lib/api.ts`) sets `withCredentials: true`, so the browser sends the session cookie with every request.
- A request from an origin not in `ALLOWED_ORIGINS` is rejected before it reaches any route.

In production, deploy the frontend and backend under the same site (for example `app.example.com` and `api.example.com`) so cookies behave predictably across browsers.

## Redis connection

- The backend fails to start, with a clear message, if Redis is unreachable. See [troubleshooting.md](./troubleshooting.md).
- Reconnection is handled by the Redis client in the background; a temporary Redis outage while the server is already running logs connection errors without crashing the process.
- Only the app's own session keys use the `flagger:sess:` prefix, so tools like `redis-cli --scan --pattern 'flagger:sess:*'` stay scoped to this app even if Redis is shared.

## What is not built yet

- Logging out every device at once (needs an index of session ids per user, or relies on the `sessionVersion` bump).
- Session validation middleware, forced password change, and rate limiting on login are separate tickets (A4, A6, and a later rate-limiting story).
