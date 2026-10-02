import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import type { ACTOR_TYPES, OUTCOMES } from "./constants";

export type ActorType = (typeof ACTOR_TYPES)[keyof typeof ACTOR_TYPES];
export type Outcome = (typeof OUTCOMES)[keyof typeof OUTCOMES];

/** Who and where a request came from. Built once per request by requestMeta(). */
export interface RequestMeta {
  requestId: string;
  ipAddress: string | null;
  userAgent: string | null;
}

/** A Prisma client or an active `$transaction` callback client. Accept either,
 * so a caller can write the audit row in the same transaction as its change. */
export type AuditClient = PrismaClient | Prisma.TransactionClient;

export interface WriteAuditLogInput {
  /** Set when the event is buffered, so a replay is idempotent. Generated if omitted. */
  eventId?: string;
  /** When it actually happened. Defaults to now. Set when replaying buffered events. */
  occurredAt?: Date;
  actorType: ActorType;
  /** Id of the acting user or API key. Omit (or null) for "system" and unauthenticated actors. */
  actorId?: number | null;
  /** "resource.verb", e.g. "auth.login", "user.created". */
  action: string;
  resourceType: string;
  /** String because some resources (system_settings) use a string key. */
  resourceId?: string | null;
  projectId?: number | null;
  entityId?: number | null;
  environmentId?: number | null;
  outcome?: Outcome;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  request: RequestMeta;
}

/** JSON-safe form of an event, kept in the Redis list and the local spool file. */
export type PendingAuditEvent = Omit<
  WriteAuditLogInput,
  "eventId" | "occurredAt"
> & {
  eventId: string;
  occurredAt: string;
};
