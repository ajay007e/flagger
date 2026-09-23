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

Source: `backend/src/lib/session/`.

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

## How a session is created

`establishSession(req, user)` (`backend/src/lib/session/session.utils.ts`) is the one place that logs a request into a session. It regenerates the session id first, then stores `{ userId, sessionVersion }`, so a pre-existing session id can never be reused with a different identity (session fixation). A2 (login) is its first caller; any future login-like flow (e.g. admin impersonation) should call the same helper rather than touching `req.session` directly.

## Requiring a valid session on a route

`requireAuth` (`backend/src/lib/auth/auth.utils.ts`) is opt-in per route:

```ts
router.get("/me", requireAuth, asyncHandler(getMe));
```

It never runs globally in `app.ts` — public routes (`/auth/login`, `/auth/setup-admin`) must stay reachable without a session.

On each request it loads the user fresh from the database (no caching in the session itself beyond `userId`/`sessionVersion`), so disabling a user, deleting them, or resetting their password takes effect on that user's very next request, not just their next login. It rejects with:

- `UNAUTHENTICATED` — no session at all.
- `SESSION_EXPIRED` — a session exists but the user is missing, deleted, inactive, or their stored `sessionVersion` no longer matches the session's (i.e. their password was changed or reset since this session was issued). The session is destroyed server-side in this case, not just rejected.

On success, the current user (safe fields only, no password hash) is available via `getCurrentUser(res)`, read from `res.locals.currentUser`, not from `req` — same `res.locals` approach used for the request id, since it doesn't depend on Express's ambient type augmentation working correctly.

## What is not built yet

- Session validation middleware that checks `req.session` against the database on every request, and forced password change (A4, A6).
- Logging out every device at once (needs an index of session ids per user, or relies on the `sessionVersion` bump on password reset, A6).
- Rate limiting on login (a later, separate story).
