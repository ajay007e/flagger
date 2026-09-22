import { OUTCOMES } from "./constants";
import { sanitizeAuditValue } from "./sanitize";
import type { AuditClient, WriteAuditLogInput } from "./types";

/**
 * Writes one audit row. Pass a `$transaction` callback client to commit the
 * audit row together with the change it records:
 *
 *   await prisma.$transaction(async (tx) => {
 *     const user = await tx.user.update({ ... });
 *     await writeAuditLog(tx, {
 *       actorType: ACTOR_TYPES.USER,
 *       actorId: currentUser.id,
 *       action: "user.updated",
 *       resourceType: "user",
 *       resourceId: String(user.id),
 *       before, after,
 *       request: getRequestMeta(req),
 *     });
 *   });
 *
 * Never call `prisma.auditLog.create` directly; the table is append-only and
 * this is the one place that sanitizes before/after/metadata (see L5 for the
 * database-level enforcement).
 */
export async function writeAuditLog(
  client: AuditClient,
  input: WriteAuditLogInput,
): Promise<void> {
  await client.auditLog.create({
    data: {
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      projectId: input.projectId ?? null,
      entityId: input.entityId ?? null,
      environmentId: input.environmentId ?? null,
      outcome: input.outcome ?? OUTCOMES.SUCCESS,
      before: sanitizeAuditValue(input.before) ?? undefined,
      after: sanitizeAuditValue(input.after) ?? undefined,
      metadata: sanitizeAuditValue(input.metadata) ?? undefined,
      requestId: input.request.requestId,
      ipAddress: input.request.ipAddress,
      userAgent: input.request.userAgent,
    },
  });
}
