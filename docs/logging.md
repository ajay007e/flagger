# Logging

The backend writes structured JSON logs with [pino](https://getpino.io). Every line has the same shape, every line from one request shares a `requestId`, and secrets never reach the output.

Source: `backend/src/lib/logger/`, `backend/src/middleware/request-logger.ts`.

## Logs, audit and diagnosis

|                       | Audit log                     | Diagnosis              | App logs                              |
| --------------------- | ----------------------------- | ---------------------- | ------------------------------------- |
| Question              | Who changed what?             | Is the system healthy? | What exactly happened, in order?      |
| Storage               | DB, with Redis/spool fallback | In memory              | stdout (plus a pretty console in dev) |
| Retention             | Permanent                     | None                   | Set by the platform                   |
| Needs the DB or Redis | Yes, with a fallback          | No                     | **No**                                |

The logger depends on nothing but `config/env`, so it keeps working during the outages that diagnosis detects. It is the one record that survives when the DB and Redis are both down.

## One shape for every line

```json
{
  "level": "info",
  "time": "2026-10-04T10:15:32.481Z",
  "service": "flagger-backend",
  "env": "production",
  "scope": "http",
  "event": "request.finish",
  "msg": "POST /api/v1/projects completed with 201 in 42ms",
  "requestId": "7f3c9a1e-5b2d-4c8a-9e61-0d4f2a7b8c13",
  "traceId": "7f3c9a1e-5b2d-4c8a-9e61-0d4f2a7b8c13",
  "meta": { "userId": 1, "sessionVersion": 3, "userType": "admin" },
  "data": {
    "method": "POST",
    "route": "/api/v1/projects",
    "status": 201,
    "durationMs": 42,
    "ip": "203.0.113.7",
    "userAgent": "Mozilla/5.0 (Macintosh...",
    "bodyKeys": ["key", "name", "description"],
    "queryCount": 3,
    "dbTimeMs": 18,
    "services": ["projects.createProject"]
  }
}
```

Real output is one line per event. Fields that do not apply are omitted, never `null`.

| Field       | Present             | Meaning                                                                                                                                                    |
| ----------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `level`     | always              | `trace`, `debug`, `info`, `warn`, `error` or `fatal`, printed as a label                                                                                   |
| `time`      | always              | ISO 8601, UTC                                                                                                                                              |
| `service`   | always              | `flagger-backend`                                                                                                                                          |
| `env`       | always              | `development`, `test` or `production`                                                                                                                      |
| `scope`     | always              | The area that logged: `http`, `auth`, `session`, `db`, `redis`, `diagnosis`, `health`, `audit`, `process`, `environments`, `projects`, `entities`, `users` |
| `event`     | always              | Fixed dotted name for filtering and alerting, for example `request.finish`. Keep it stable                                                                 |
| `msg`       | always              | A descriptive sentence for people. The wording can change freely                                                                                           |
| `requestId` | in a request        | Same id as `audit_logs.request_id`, the `x-request-id` header and the `requestId` in error bodies                                                          |
| `traceId`   | in a request or job | Equals `requestId`, or a valid incoming `x-trace-id`, or a per-run id for background work                                                                  |
| `meta`      | optional            | Context, not for filtering: `userId`, `sessionVersion`, `userType`. Never an email                                                                         |
| `data`      | optional            | Event values. Strings, numbers, booleans and arrays of those, nothing else                                                                                 |
| `err`       | on failures         | `type`, `message`, `code`, and `stack` (stack frames only, logs only, never sent to a client)                                                              |

## Correlation

- Every request gets a `requestId`: a client-supplied `x-request-id` if it matches `^[A-Za-z0-9_-]{8,36}$`, otherwise a generated UUID.
- `traceId` equals `requestId`, unless the request carries a valid `x-trace-id` (`^[A-Za-z0-9_-]{8,64}$`). Anything else is ignored, which prevents log injection through the header.
- `meta.userId`, `meta.sessionVersion` and `meta.userType` are added by `requireAuth`, so only lines after authentication carry them. A failed login that finds a user adds `userId` as well.
- Health cycles and `guardedJob` runs have no request. Each run gets its own `traceId` and no `requestId`, so everything it logs, including the DB queries and a resulting `diagnosis.status.changed`, can be followed together.

## Levels

| Level   | Used for                                                                                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `trace` | SQL text and duration for every query                                                                                                                              |
| `debug` | Controller enter/exit, health check results, diagnosis cycle details, guard blocks, background job runs                                                            |
| `info`  | Request start and finish, service start and end, decision snapshots, connects, startup, shutdown, replays                                                          |
| `warn`  | 4xx responses, auth and session denials, validation failures, slow queries, audit fallbacks, failed health checks, requests blocked while `DOWN`, Redis reconnects |
| `error` | 5xx and unexpected errors, queries over the error threshold, invariant violations, Redis errors, lost audit events                                                 |
| `fatal` | `uncaughtException`, and the server failing to listen                                                                                                              |

The default level is `info` in production and `debug` otherwise, so production does not print controller lines or SQL unless you ask for them.

## Events

### `http` (requests and boundaries)

| Event                                  | Level                         | When                                                                                                                                                                                    |
| -------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `request.start`                        | info                          | A request arrives. Mounted before `cors`, so rejected requests are still logged                                                                                                         |
| `request.finish`                       | info, warn (4xx), error (5xx) | The response is sent. Carries method, route pattern, status, duration, `bodyKeys` and the summary (`queryCount`, `dbTimeMs`, `services`). A 503 from the diagnosis guard logs at `warn` |
| `request.aborted`                      | warn                          | The client closed the connection before a response                                                                                                                                      |
| `request.error`                        | warn or error                 | An error became a response. Logged once, here. 4xx and `P2002` at `warn` without a stack; unexpected errors and infrastructure failures at `error` with the stack                       |
| `request.validation.failed`            | warn                          | Body, params or query failed validation. Logs `source` and field names, never values                                                                                                    |
| `controller.enter` / `controller.exit` | debug                         | A controller starts and ends, named after the handler function                                                                                                                          |

### Services and decisions (scope is the resource: `environments`, `projects`, `entities`, `auth`)

| Event                      | Level             | When                                                                                                                                                                                                                            |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `service.start`            | info              | A service function is called. Logs only top-level number and boolean arguments (ids)                                                                                                                                            |
| `service.end`              | info, warn, error | It finishes. Failures log the error type, code and status, never the stack                                                                                                                                                      |
| `<resource>.<noun>.<verb>` | info, error       | A decision snapshot at a branch that changes the outcome, for example `project.key.reserved`, `entity.parent.inactive`, `environment.reorder.rejected`. Invariant violations such as `project.restore.invariant` log at `error` |

### Auth and sessions

| Event                                              | Level       | When                                                                                                                                     |
| -------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.denied`                                      | warn        | A guard rejected the request. `data.reason`: `no_session`, `must_change_password`, `not_admin`, `setup_key_missing`, `setup_key_invalid` |
| `session.rejected`                                 | warn        | A session was destroyed. `data.reason`: `user_missing`, `user_inactive`, `version_mismatch`                                              |
| `auth.login.rejected`                              | warn        | A login failed. Logs `userFound`, `userActive`, `passwordMatches` only, never the email                                                  |
| `auth.setup.rejected`                              | warn        | First-admin setup refused (`admin_exists`, `email_taken`)                                                                                |
| `auth.password.rejected` / `auth.password.changed` | warn / info | A password change failed or succeeded                                                                                                    |

### Database and Redis

| Event                                             | Level       | When                                                             |
| ------------------------------------------------- | ----------- | ---------------------------------------------------------------- |
| `db.query`                                        | trace       | Every query: SQL text and duration, never parameters             |
| `db.query.slow`                                   | warn, error | At or above `LOG_SLOW_QUERY_WARN_MS` / `LOG_SLOW_QUERY_ERROR_MS` |
| `db.warn`, `db.error`                             | warn, error | Prisma reported a warning or error (target only)                 |
| `db.connected`, `db.connect.failed`               | info, error | The background connect at startup                                |
| `redis.connect`, `redis.ready`, `redis.connected` | info        | Connection progress                                              |
| `redis.reconnecting`, `redis.end`                 | warn        | The client is retrying or the connection closed                  |
| `redis.error`, `redis.connect.failed`             | error       | A client error. Logged on every failed retry                     |

### Diagnosis, health and jobs

| Event                                                                                                    | Level                        | When                                                                  |
| -------------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------- |
| `diagnosis.status.changed`                                                                               | warn (to DOWN), info (to UP) | The status moved. `data` has `from`, `to` and `reason`                |
| `diagnosis.cycle.clean`, `.failed`, `.discarded`, `diagnosis.markDown.repeat`, `diagnosis.guard.blocked` | debug                        | Cycle details, repeat failures while already `DOWN`, requests blocked |
| `diagnosis.scheduler.started` / `.stopped`                                                               | info                         | The scheduler starts or stops                                         |
| `diagnosis.listener.failed`                                                                              | error                        | A transition listener threw                                           |
| `health.check.passed`                                                                                    | debug                        | One check passed, with its duration                                   |
| `health.check.failed`                                                                                    | warn                         | One check failed or timed out                                         |
| `health.cycle.completed`                                                                                 | debug, warn                  | A whole cycle finished                                                |
| `job.skipped`, `job.start`, `job.end`                                                                    | debug, warn                  | A `guardedJob` run. A failed run ends at `warn`                       |

### Audit fallback and process

| Event                                                | Level      | When                                                                               |
| ---------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| `audit.fallback.redis`, `audit.fallback.spool`       | warn       | An audit event was buffered because the DB write did not happen                    |
| `audit.event.lost`                                   | error      | The DB, Redis and the spool file all failed. Logs `action` and `auditEventId` only |
| `audit.replay.completed`                             | info, warn | Buffered events were replayed, with counts (`replayed`, `duplicate`, `discarded`)  |
| `audit.drain.stopped`                                | warn       | A replay failed and will be retried                                                |
| `process.start`                                      | info       | The server is listening (port, pid, Node version)                                  |
| `process.shutdown`, `process.shutdown.complete`      | info       | `SIGTERM` or `SIGINT` received, and shutdown finished                              |
| `process.shutdown.timeout`                           | error      | Shutdown took longer than 10 seconds and was forced                                |
| `process.unhandledRejection`                         | error      | A promise rejected with no handler                                                 |
| `process.uncaughtException`, `process.listen.failed` | fatal      | The process is exiting. Logs are flushed first                                     |

## Following a request

Search for the `requestId` (it is in the `x-request-id` response header and in every error body). In order you will see:

1. `request.start`
2. `controller.enter` (debug)
3. `service.start`, then any decision snapshot, then the `db.query` lines (trace), then `service.end`
4. `controller.exit` (debug)
5. `request.error`, if it failed
6. `request.finish` with the status, duration and summary

The lines you can see depend on `LOG_LEVEL`. A `service.start` with no `service.end` means the request died inside that service. To match an audit row, take its `request_id` and search for it.

| Symptom                            | Where to look                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| A 500                              | `request.error` at `error`, with the stack frames, found by `requestId`                                      |
| A 4xx the user does not understand | `request.error` at `warn`, or `request.validation.failed` for the field names                                |
| A slow request                     | `durationMs`, `queryCount` and `dbTimeMs` on `request.finish`, then `db.query.slow`                          |
| Access denied unexpectedly         | `auth.denied` or `session.rejected`, with the `reason` and `meta.userId`                                     |
| An action was refused              | The decision snapshot for that branch, for example `entity.restore.refused`                                  |
| The system went `DOWN`             | `diagnosis.status.changed`, then the `health.check.failed` and `redis.error` lines just before               |
| An audit row is missing            | `audit.fallback.*`, `audit.replay.completed` and `audit.event.lost`                                          |
| A wrong result with no error       | Raise `LOG_LEVEL` to `trace` for the next occurrence, read the decision snapshots, then reproduce it locally |

Logs show what ran and with which inputs. They cannot say why the logic is wrong: turn the trail into a local reproduction.

## What is never logged

Passwords, password hashes, cookies, session ids, tokens, the setup key, request or response bodies, SQL parameters and emails. A user is identified by `userId`. The attempted email of a failed login stays in the audit `metadata` only.

How this is enforced:

- **Redaction by name.** Keys named like secrets (`password`, `token`, `secret`, `cookie`, `authorization`, `email`, ...) are replaced with `[REDACTED]` in `data`, `meta` and `err`. The list is in `lib/logger/redact.ts`.
- **Typed `data`.** It accepts primitives and arrays of primitives only, so a body or an object cannot be passed in.
- **Bodies become field names.** Requests log `bodyKeys`, validation failures log `rejectedFields`.
- **Safe errors.** Only `type`, `message`, `code` and stack frames are kept. Prisma error messages, which can embed query values, are replaced by their code.
- **Length caps.** `msg` 500 characters, SQL 2000, `userAgent` 200, other strings 200, arrays 50 items.
- **Line safety.** JSON output escapes newlines, so a value cannot forge a second log line.
- **Never break a request.** If the logger itself throws, the error is swallowed.
- **No `console`.** ESLint fails on it, so nothing bypasses the logger. The only exceptions are the env boot error and the seed script.

## Using the logger

```ts
import { getLogger } from "@/lib/logger";

const log = getLogger("projects");

log.info("project.restore.refused", "Project restore refused because it was not found or is not deleted", {
  data: { projectId: id, found: false },
});
```

The signature is `log.<level>(event, msg, { data, err })`. Rules:

- **Log events, not values.** Log ids, booleans, counts and enums that explain a decision. Never log a string a user typed.
- **Throw, don't log.** A service that throws an `AppError` does not log it. The error handler logs it once. Log in a service only for a decision snapshot or an invariant violation.
- **Name events `noun.verb`**, lowercase and dot-separated, and keep them stable.
- **Pick the level by meaning**, using the table above.
- **A new scope** goes in `LOG_SCOPES` in `config/env/log.constants.ts`.
- **A new service** gets a `<resource>.instrumented.ts` that exports `instrument("<scope>", service)`, and its controller imports from it. That gives `service.start` and `service.end` with no hand-written lines.
- **Middleware that runs before the error handler** calls `recordRoute(req, res)`, because Express resets `baseUrl` before the error handler runs.
- **A new background job** is wrapped in `guardedJob(fn, "name")`, which gives each run its own `traceId`.
- **Set user context** after authentication with `setLogMeta({ userId, ... })`. Never put an email in `meta`.

## Configuration

| Variable                  | Default                                 | Notes                                                                       |
| ------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| `LOG_LEVEL`               | `info` in production, `debug` otherwise | `trace` to `fatal`, or `silent`                                             |
| `LOG_SCOPES`              | all                                     | Comma-separated scopes. Scopes not listed log `warn` and above only         |
| `LOG_SYNC`                | `true`                                  | Production only. `false` buffers writes and relies on a flush at exit       |
| `LOG_SLOW_QUERY_WARN_MS`  | `500`                                   | Queries at or above this log `db.query.slow` at `warn`                      |
| `LOG_SLOW_QUERY_ERROR_MS` | `2000`                                  | Must be greater than the warn threshold. Queries at or above log at `error` |
| `TRUST_PROXY_HOPS`        | `1` in production, `0` otherwise        | Needed for a correct `ip`. A wrong value lets clients spoof it              |

Settings are read at startup, so changing them needs a restart. Details in [configuration.md](./configuration.md).

## Where logs go

- **Development:** a pretty, colored console. There is no log file.
- **Production:** one JSON object per line on stdout, written synchronously, with no transport. The platform that runs the backend (a container log driver, systemd, a host agent) captures it. Recommended: keep 30 days, restrict read access to admins, and keep the store outside the app's reach so the app cannot rewrite its own history. Retention and access are the platform's job; the app does not enforce them.
- **Querying:** a log store with search (for example Loki fed by an agent that reads stdout) makes "log everything" usable. Without one, filter the JSON with `jq`:

  ```bash
  jq 'select(.requestId == "7f3c9a1e-5b2d-4c8a-9e61-0d4f2a7b8c13")' app.log
  ```

## What is not built yet

- The frontend does not show the `requestId` from error responses, and there is no frontend error reporting.
- No log store or retention is set up. That depends on where the backend is deployed.
- `LOG_LEVEL` and `LOG_SCOPES` cannot be changed at runtime.
