# Audit log

Every meaningful action in the service is recorded in one append-only table, `audit_logs`. It exists from the start (this ticket), and later tickets write to it as each feature is built.

## What gets recorded

Each row answers: who did what, to what, and what changed.

| Column                                      | Meaning                                                                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `created_at`                                | When it happened (UTC, ms precision)                                                                                                   |
| `event_id`                                  | Unique id (UUID) generated when the event happens. Makes replay from the outage buffer idempotent. Null on rows from before it existed |
| `actor_type`, `actor_id`                    | Who did it: a user, an API key, or the system. `actor_id` is null for `system` and for unauthenticated events (e.g. a failed login)    |
| `action`                                    | What happened, as `resource.verb`, e.g. `auth.login`, `user.created`                                                                   |
| `resource_type`, `resource_id`              | What it happened to. `resource_id` is a string (some resources, like `system_settings`, use a string key, not a numeric id)            |
| `project_id`, `entity_id`, `environment_id` | Scope, used later to decide who can see the row (Epic 4). Null when not applicable                                                     |
| `outcome`                                   | `success` or `failure`                                                                                                                 |
| `before`, `after`                           | Field-level diff for updates, both null when there is nothing to diff                                                                  |
| `metadata`                                  | Anything else worth keeping (e.g. the attempted email on a failed login)                                                               |
| `request_id`, `ip_address`, `user_agent`    | Where the request came from                                                                                                            |

`before`, `after`, and `metadata` are sanitized: any field named like a secret (`password`, `token`, `secret`, `apiKey`, ...) is replaced with `[redacted]` before the row is written, recursively, regardless of nesting. See `SENSITIVE_FIELD_NAMES` in `backend/src/lib/audit/constants.ts`.

## Writing an audit row

Never call `prisma.auditLog.create` directly. Use the writer, and pass a `$transaction` client so the audit row commits or rolls back together with the change it records:

```ts
import { ACTOR_TYPES, getRequestMeta, writeAuditLog } from "@/lib/audit";

await prisma.$transaction(async (tx) => {
  const user = await tx.user.update({ where: { id }, data });

  await writeAuditLog(tx, {
    actorType: ACTOR_TYPES.USER,
    actorId: currentUser.id,
    action: "user.updated",
    resourceType: "user",
    resourceId: String(user.id),
    before,
    after: user,
    request: getRequestMeta(req, res),
  });
});
```

For an event with no transaction (e.g. a failed login), pass `prisma` itself as the client:

```ts
await writeAuditLog(prisma, {
  actorType: ACTOR_TYPES.SYSTEM,
  action: "auth.login_failed",
  resourceType: "user",
  outcome: OUTCOMES.FAILURE,
  metadata: { attemptedEmail: email },
  request: getRequestMeta(req, res),
});
```

## When the database is down

`writeAuditLog` needs the database. Events that must survive an outage (system events such as `diagnosis.down`) use `recordAuditEvent` instead. It never throws:

1. Write to the DB (skipped while the system is `DOWN`).
2. Otherwise push to the Redis list `flagger:audit:pending` and log `audit.fallback.redis` at `warn`.
3. Otherwise append to a local JSONL file (`AUDIT_SPOOL_PATH`, capped at 5 MB) and log `audit.fallback.spool` at `warn`. If the file is full or unwritable too, log `audit.event.lost` at `error` with only the action and `eventId`, never the payload, because audit metadata can hold an attempted email.

After recovery, and every 30 s while `UP`, `drainAuditEvents` replays Redis (atomic `LMOVE` to `flagger:audit:processing`, removed only after the insert), then the file. A duplicate `event_id` counts as success, so a crash mid-drain can't create duplicate rows. Unparseable payloads move to `flagger:audit:dead`.

Notes:

- Events are sanitized before they are buffered, so secrets never reach Redis or disk.
- Replayed rows keep their original `created_at`, so `id` order is not time order. **Sort by `created_at`.**
- Writes that commit together with a business change keep using `writeAuditLog(tx, ...)`. Those fail with the change.
- Each instance has its own spool file. The Redis list is shared.
- Each replay logs `audit.replay.completed` with counts (`replayed`, `duplicate`, `discarded`), but only when there was something to replay.

## Request id

Every request gets a request id (`requestId` middleware, registered first in `app.ts`): a client-supplied `x-request-id` header if it matches `^[A-Za-z0-9_-]{8,36}$` (so it always fits the `request_id` column), otherwise a generated UUID. It is echoed back as the same response header, included in every error body, and carried on every log line from that request (see [logging.md](./logging.md)). Every audit row written while handling that request shares it, so the rows from one request can be found together and matched to the full trail of what the request did.

`getRequestMeta(req, res)` reads the request id, IP address, and user agent off the request. Call it once per request (usually right where you already have `req`) and pass the result to `writeAuditLog`.

## Action naming

`resource.verb`, lowercase, dot-separated: `auth.login`, `auth.login_failed`, `user.created`, `user.password_reset`, `access.revoked`. Keep the resource part the same as `resourceType`.

## What is not built yet

- A retry cap in the drain. A permanently failing event blocks the queue.
- **L2, L3**: the actual calls to `writeAuditLog` from auth, user, and catalog features, as those are built.
- **L4**: an endpoint to list and filter audit rows, with visibility limited by scope.
- **L5**: revoking `UPDATE`/`DELETE` on `audit_logs` from the app's database user, so the append-only rule is enforced by MySQL, not just by convention.
- **L6**: an admin screen for browsing the log.
