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

**HTTP.** `diagnosisGuard` returns `503` with a `Retry-After: 15` header and the standard error body (code `SERVICE_UNAVAILABLE`, see [api-errors.md](./api-errors.md)). It is read-only and changes no state. It is mounted after `cors` (so the browser can read the 503) and before the session middleware (so a Redis outage returns 503, not a session error). The guard marks its 503s, so the request log records them at `warn` and not `error`. Without that, an outage would write an error line for every request.

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

`message` is generic on purpose. The real reason (which can include driver errors) is only in the server log and the audit log, never in this response.

|               | `GET /api/v1/health`                    | `GET /api/v1/diagnosis`       |
| ------------- | --------------------------------------- | ----------------------------- |
| Question      | Is each dependency reachable right now? | Is the system allowed to act? |
| Cost          | Real I/O on every call (2 s timeout)    | Reads memory                  |
| Audience      | Ops, orchestrators                      | The frontend, any client      |
| Changes state | Never                                   | Never                         |

They can disagree: health can say `ok` while diagnosis is still `DOWN`, because recovery waits for the scheduler's next full cycle. That is intentional.

## Starting with dependencies down

The server listens first, then connects to MySQL and Redis in the background. A failed connect is logged (`db.connect.failed`, `redis.connect.failed`) and is not fatal, so the server can answer 503 and serve the status endpoint. Redis uses `disableOfflineQueue`, so commands fail immediately while it is disconnected instead of hanging.

## Audit fallback

`diagnosis.down` and `diagnosis.up` are written as `system` events. They can't depend on the database being up, so they use `recordAuditEvent`, which never throws:

1. Write to the DB (skipped while `DOWN`, 3 s timeout).
2. Otherwise push to the Redis list `flagger:audit:pending` and log `audit.fallback.redis` at `warn`.
3. Otherwise append to a local JSONL file (`AUDIT_SPOOL_PATH`, capped at 5 MB) and log `audit.fallback.spool` at `warn`. If the file is full or unwritable too, log `audit.event.lost` at `error` with only the action and `eventId`, never the payload, because audit metadata can hold an attempted email.

After recovery, and every 30 s while `UP`, the drain replays Redis (atomic `LMOVE` to `flagger:audit:processing`, removed only after the insert), then the spool file. Each event carries an `eventId` and its original `occurredAt` from the moment it happened, so a replay keeps the right `created_at` and a duplicate (`P2002` on `event_id`) counts as success. Unparseable payloads go to `flagger:audit:dead`. Details in [audit.md](./audit.md).

## Logging

Diagnosis logs through the normal logger (see [logging.md](./logging.md)).

| Event                                            | Level                                  | When                                                   |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------ |
| `diagnosis.status.changed`                       | `warn` going `DOWN`, `info` going `UP` | The status moved. `data` has `from`, `to` and `reason` |
| `health.check.failed`                            | `warn`                                 | One check failed or timed out                          |
| `health.cycle.completed`                         | `debug` clean, `warn` failing          | A whole cycle finished                                 |
| `diagnosis.cycle.clean`, `.failed`, `.discarded` | `debug`                                | Cycle details and the clean-cycle count                |
| `job.skipped`, `job.start`, `job.end`            | `debug`                                | A `guardedJob` run                                     |

Each health cycle and each guarded job run has its own `traceId` and no `requestId`, so a failing check, the queries it ran and the transition it caused can be followed together.

## Frontend

- `shared/lib/diagnosis` holds a store with `UNKNOWN`, `UP` and `DOWN`. It lives in `shared/lib` because the axios client in `shared/lib/api.ts` has to flip it.
- The axios interceptor sets `DOWN` on any `503`, any `SERVICE_UNAVAILABLE` code, or no response at all (backend unreachable).
- `useDiagnosisPolling` polls `/api/v1/diagnosis` every 5 s while `DOWN` and every 20 s while `UP`. A poll that started before a newer `DOWN` signal can't restore `UP`.
- `DiagnosisGate` wraps the app shell. `UNKNOWN` renders nothing, `DOWN` renders only `ServiceUnavailableModal` (no close button, Escape or backdrop dismissal), and `UP` renders the app. Children unmount while `DOWN`, so unsaved UI state is lost by design.

## Multiple instances

The status is held in memory per backend instance. A shared status in Redis would be unreadable exactly when Redis is down. Instances converge within one cycle because DB and Redis are shared, but behind a load balancer the modal can briefly flicker while instances disagree. The audit drain is safe with several instances.

## MySQL 8.4 and reconnecting

MySQL 8.4 uses `caching_sha2_password`, and its auth cache is empty after a container restart. Over a non-TLS connection the driver can't finish a full authentication unless `allowPublicKeyRetrieval=true` is set, so the pool stays at `active=0 idle=0` and the system stays `DOWN`. `config/db/client.ts` sets this, plus fail-fast timeouts (`connectTimeout` and `acquireTimeout` 2 s, `socketTimeout` 3 s). It is for development only: use TLS (`ssl=true`) in production. See [troubleshooting.md](./troubleshooting.md).

## Trying it locally

Use `docker compose stop|start <service>`, not `down`/`up`.

1. `docker compose stop redis`: `UP -> DOWN` within a second or two, modal shown, API returns 503.
2. `docker compose start redis`: the modal stays until the next clean cycle, then clears.
3. Repeat with `mysql`.

Don't run anything inside the MySQL container while testing recovery. A login from inside it fills the auth cache and hides the reconnect problem above.

## What is not built yet

- A retry cap in the audit drain. A permanently failing event blocks the queue (retried every 30 s).
- Shared state across instances.
- A loader while the status is `UNKNOWN` (the page is blank for one round trip).
- A backend container with a mounted volume for `AUDIT_SPOOL_PATH`. Each replica needs its own volume.
