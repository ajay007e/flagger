import { randomUUID } from "node:crypto";
import {
  appendFile,
  mkdir,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { env } from "@/config/env";
import { prisma } from "@/config/db";
import { redis } from "@/config/redis";
import { diagnosis } from "@/lib/diagnosis";
import { describeFailure, getLogger } from "@/lib/logger";

import {
  AUDIT_DB_WRITE_TIMEOUT_MS,
  AUDIT_DEAD_KEY,
  AUDIT_DRAIN_BATCH,
  AUDIT_DRAIN_INTERVAL_MS,
  AUDIT_PENDING_KEY,
  AUDIT_PROCESSING_KEY,
  AUDIT_SPOOL_MAX_BYTES,
} from "./constants";
import { sanitizeAuditValue } from "./sanitize";
import type { PendingAuditEvent, WriteAuditLogInput } from "./types";
import { writeAuditLog } from "./writer";

type ReplayResult = "replayed" | "duplicate" | "discarded";
type ReplayCounts = Record<ReplayResult, number>;

const log = getLogger("audit");

const AUDIT_SPOOL_PATH = env.auditSpoolPath;
const DRAINING_PATH = `${AUDIT_SPOOL_PATH}.draining`;
const TIMEOUT_MESSAGE = "audit write timed out";

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const t = new Promise<never>((_, rej) => {
    timer = setTimeout(() => rej(new Error(TIMEOUT_MESSAGE)), ms);
  });
  return Promise.race([p, t]).finally(() => clearTimeout(timer));
}

function failureReason(error: unknown): string {
  return error instanceof Error && error.message === TIMEOUT_MESSAGE
    ? "timeout"
    : describeFailure(error).errorType;
}

function toPending(input: WriteAuditLogInput): PendingAuditEvent {
  return {
    ...input,
    eventId: input.eventId ?? randomUUID(),
    occurredAt: (input.occurredAt ?? new Date()).toISOString(),
    before: sanitizeAuditValue(input.before),
    after: sanitizeAuditValue(input.after),
    metadata: sanitizeAuditValue(input.metadata),
  };
}

const fromPending = (e: PendingAuditEvent): WriteAuditLogInput => ({
  ...e,
  occurredAt: new Date(e.occurredAt),
});

async function appendToSpool(line: string): Promise<boolean> {
  try {
    await mkdir(path.dirname(AUDIT_SPOOL_PATH), { recursive: true });
    const size = await stat(AUDIT_SPOOL_PATH).then(
      (s) => s.size,
      () => 0,
    );
    if (size + line.length > AUDIT_SPOOL_MAX_BYTES) return false;
    await appendFile(AUDIT_SPOOL_PATH, `${line}\n`);
    return true;
  } catch {
    return false;
  }
}

export async function recordAuditEvent(
  input: WriteAuditLogInput,
): Promise<void> {
  const event = toPending(input);
  const line = JSON.stringify(event);
  const ids = { action: event.action, auditEventId: event.eventId };
  const dbSkipped = !diagnosis.isUp();
  let dbFailure: string | undefined;
  let redisFailure: string | undefined;

  if (!dbSkipped) {
    try {
      await withTimeout(
        writeAuditLog(prisma, fromPending(event)),
        AUDIT_DB_WRITE_TIMEOUT_MS,
      );
      return;
    } catch (error) {
      dbFailure = failureReason(error);
    }
  }

  try {
    await redis.rPush(AUDIT_PENDING_KEY, line);
    log.warn(
      "audit.fallback.redis",
      `Audit event ${event.action} was buffered in Redis because the database write did not happen`,
      { data: { ...ids, target: "redis", dbSkipped, dbFailure } },
    );
    return;
  } catch (error) {
    redisFailure = failureReason(error);
  }

  if (await appendToSpool(line)) {
    log.warn(
      "audit.fallback.spool",
      `Audit event ${event.action} was written to the local spool file because the database and Redis are unavailable`,
      { data: { ...ids, target: "spool", dbSkipped, dbFailure, redisFailure } },
    );
    return;
  }

  log.error(
    "audit.event.lost",
    `Audit event ${event.action} was lost because the database, Redis and the spool file all failed`,
    { data: { ...ids, dbSkipped, dbFailure, redisFailure } },
  );
}

async function insertOnce(
  event: PendingAuditEvent,
): Promise<"replayed" | "duplicate"> {
  try {
    await writeAuditLog(prisma, fromPending(event));
    return "replayed";
  } catch (err) {
    if ((err as { code?: string }).code !== "P2002") throw err;
    return "duplicate";
  }
}

async function replayRedisItem(raw: string): Promise<ReplayResult> {
  let event: PendingAuditEvent;
  try {
    event = JSON.parse(raw) as PendingAuditEvent;
  } catch {
    await redis.rPush(AUDIT_DEAD_KEY, raw);
    await redis.lRem(AUDIT_PROCESSING_KEY, 1, raw);
    return "discarded";
  }
  const result = await insertOnce(event);
  await redis.lRem(AUDIT_PROCESSING_KEY, 1, raw);
  return result;
}

const emptyCounts = (): ReplayCounts => ({
  replayed: 0,
  duplicate: 0,
  discarded: 0,
});

async function drainRedis(): Promise<ReplayCounts> {
  const counts = emptyCounts();

  for (const raw of await redis.lRange(AUDIT_PROCESSING_KEY, 0, -1)) {
    counts[await replayRedisItem(raw)]++;
  }

  for (let i = 0; i < AUDIT_DRAIN_BATCH; i++) {
    const raw = await redis.lMove(
      AUDIT_PENDING_KEY,
      AUDIT_PROCESSING_KEY,
      "LEFT",
      "RIGHT",
    );
    if (raw === null) break;
    counts[await replayRedisItem(raw)]++;
  }

  return counts;
}

async function drainSpool(): Promise<ReplayCounts> {
  const counts = emptyCounts();
  let content: string;

  try {
    content = await readFile(DRAINING_PATH, "utf8");
  } catch {
    try {
      await rename(AUDIT_SPOOL_PATH, DRAINING_PATH);
      content = await readFile(DRAINING_PATH, "utf8");
    } catch {
      return counts;
    }
  }

  const lines = content.split("\n").filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    let event: PendingAuditEvent;
    try {
      event = JSON.parse(lines[i]) as PendingAuditEvent;
    } catch {
      counts.discarded++;
      continue;
    }
    try {
      counts[await insertOnce(event)]++;
    } catch (err) {
      await writeFile(DRAINING_PATH, `${lines.slice(i).join("\n")}\n`);
      throw err;
    }
  }
  await unlink(DRAINING_PATH);

  return counts;
}

function logReplay(source: "redis" | "spool", counts: ReplayCounts): void {
  if (counts.replayed + counts.duplicate + counts.discarded === 0) return;

  log[counts.discarded > 0 ? "warn" : "info"](
    "audit.replay.completed",
    `Replayed ${counts.replayed} buffered audit event(s) from ${source}`,
    { data: { source, ...counts } },
  );
}

let draining = false;

export async function drainAuditEvents(): Promise<void> {
  if (draining || !diagnosis.isUp()) return;
  draining = true;
  try {
    logReplay("redis", await drainRedis());
    logReplay("spool", await drainSpool());
  } catch (err) {
    log.warn("audit.drain.stopped", "Audit replay stopped and will retry", {
      err,
    });
  } finally {
    draining = false;
  }
}

export function startAuditDrain(): () => void {
  const timer = setInterval(
    () => void drainAuditEvents(),
    AUDIT_DRAIN_INTERVAL_MS,
  );
  return () => clearInterval(timer);
}
