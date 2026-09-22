# Audit log

Every meaningful action in the service is recorded in one append-only table, `audit_logs`. It exists from the start (this ticket), and later tickets write to it as each feature is built.

## What gets recorded

Each row answers: who did what, to what, and what changed.

| Column                                      | Meaning                                                                                                                             |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `created_at`                                | When it happened (UTC, ms precision)                                                                                                |
| `actor_type`, `actor_id`                    | Who did it: a user, an API key, or the system. `actor_id` is null for `system` and for unauthenticated events (e.g. a failed login) |
| `action`                                    | What happened, as `resource.verb`, e.g. `auth.login`, `user.created`                                                                |
| `resource_type`, `resource_id`              | What it happened to. `resource_id` is a string (some resources, like `system_settings`, use a string key, not a numeric id)         |
| `project_id`, `entity_id`, `environment_id` | Scope, used later to decide who can see the row (Epic 4). Null when not applicable                                                  |
| `outcome`                                   | `success` or `failure`                                                                                                              |
| `before`, `after`                           | Field-level diff for updates, both null when there is nothing to diff                                                               |
| `metadata`                                  | Anything else worth keeping (e.g. the attempted email on a failed login)                                                            |
| `request_id`, `ip_address`, `user_agent`    | Where the request came from                                                                                                         |

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

## Request id

Every request gets a request id (`requestId` middleware in `app.ts`, registered before everything else): a client-supplied `x-request-id` header if present, otherwise a generated UUID. It is echoed back as the same response header, and every audit row written while handling that request shares it, so all the rows from one request can be found together.

`getRequestMeta(req, res)` reads the request id, IP address, and user agent off the request. Call it once per request (usually right where you already have `req`) and pass the result to `writeAuditLog`.

## Action naming

`resource.verb`, lowercase, dot-separated: `auth.login`, `auth.login_failed`, `user.created`, `user.password_reset`, `access.revoked`. Keep the resource part the same as `resourceType`.

## What is not built yet

- **L2, L3**: the actual calls to `writeAuditLog` from auth, user, and catalog features, as those are built.
- **L4**: an endpoint to list and filter audit rows, with visibility limited by scope.
- **L5**: revoking `UPDATE`/`DELETE` on `audit_logs` from the app's database user, so the append-only rule is enforced by MySQL, not just by convention.
- **L6**: an admin screen for browsing the log.
