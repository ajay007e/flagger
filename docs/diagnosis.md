# Diagnosis

The Diagnosis Service owns the system's health state: `UP` or `DOWN`. While it is `DOWN`, the backend blocks every action and the frontend shows only a "Service unavailable" modal.

Three rules never change:

- **The Diagnosis Service owns the state.** Anything may mark the system `DOWN`.
- **The scheduler owns recovery.** Only a full, clean health-check cycle can move `DOWN` to `UP`. A successful request never does.
- **The frontend only reflects the backend status.** It never decides it.

Source: `backend/src/lib/diagnosis/`, `frontend/feature/diagnosis/`, `frontend/shared/lib/diagnosis/`.

## States

| State  | Meaning                                                              |
| ------ | -------------------------------------------------------------------- |
| `DOWN` | A dependency failed. All actions are blocked. This is the boot state |
| `UP`   | The last scheduler cycle was fully clean. Normal operation           |

The service boots `DOWN` (fail closed) and stays there until the first clean cycle.

## What moves the status

**To `DOWN`** (immediately, from anywhere):

- The error handler receives a critical infrastructure error.
- The Redis client emits `error` or `end`.
- An `unhandledRejection` carries a critical error.
- A scheduler cycle has any failure.

**To `UP`** (scheduler only):

- One complete cycle where every health check passes (`REQUIRED_CLEAN_CYCLES = 1` in `diagnosis.constants.ts`).
- A cycle with zero registered checks counts as a failure.
- A `markDown` that happens during a cycle discards that cycle, so a failure that races a cycle can't recover the system.

**Critical errors** are infrastructure failures only: Prisma connection errors (`P1000`-`P1003`, `P1008`, `P1017`, `P2024`, `PrismaClientInitializationError`), pool timeouts (driver code `45028`), Node network codes (`ECONNREFUSED`, `ECONNRESET`, `ETIMEDOUT`, ...), and node-redis offline/closed errors (matched by class name). Validation errors, 4xx responses and a single ordinary 500 do not trip `DOWN`.

## The scheduler

| Setting           | Value                                     |
| ----------------- | ----------------------------------------- |
| Cycle interval    | 15 s                                      |
| Per-check timeout | 5 s                                       |
| Checks            | Run in parallel, cycles never overlap     |
| Default checks    | `database` (`SELECT 1`), `redis` (`PING`) |

It starts after the server begins listening, runs once immediately, and runs again as soon as the initial DB and Redis connects settle, so a normal boot reaches `UP` in a second or two. After a dependency comes back, expect `UP` within about 15 to 30 s.

Add a check with `registerHealthCheck({ name, run })` (see `diagnosis.checks.ts`). Constants live in `diagnosis.constants.ts`.

## What is blocked

**HTTP.** `diagnosisGuard` returns `503` with a `Retry-After: 15` header and the standard error body (code `SERVICE_UNAVAILABLE`, see [api-errors.md](./api-errors.md)). It is read-only and changes no state. It is mounted after `cors` (so the browser can read the 503) and before the session middleware (so a Redis outage returns 503, not a session error).

Two paths stay reachable while `DOWN` and skip the session middleware: `/api/v1/diagnosis` and `/api/v1/health`. The list is `GUARD_EXEMPT_PATHS`. `GET /` is not exempt, so point infrastructure probes at `/api/v1/health`.

**Background jobs.** Wrap every job or scheduled action in `guardedJob(fn)`. It skips the run while `DOWN` (no queueing, no retry storm). There are no jobs yet.

## Endpoints

`GET /api/v1/diagnosis` is public, needs no session, and is never cached.

```json
{
  "success": true,
  "data": {
    "status": "DOWN",
    "message": "Service is temporarily unavailable.",
    "since": "2026-10-03T08:15:02.114Z",
    "lastCheckedAt": "2026-10-03T08:15:17.230Z"
  }
}
```

`message` is generic on
