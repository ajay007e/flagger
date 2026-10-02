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

const AUDIT_SPOOL_PATH = env.auditSpoolPath;
const DRAINING_PATH = `${AUDIT_SPOOL_PATH}.draining`;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const t = new Promise<never>((_, rej) => {
    timer = setTimeout(() => rej(new Error("audit write timed out")), ms);
  });
  return Promise.race([p, t]).finally(() => clearTimeout(timer));
}

// Sanitized here so secrets never reach Redis or disk.
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

/**
 * Best-effort audit write for events that must survive an outage (system events,
 * failures). Never throws. DB -> Redis list -> local JSONL spool.
 * For writes that commit with a business change, keep using writeAuditLog(tx, ...).
 */
export async function recordAuditEvent(
  input: WriteAuditLogInput,
): Promise<void> {
  const event = toPending(input);
  const line = JSON.stringify(event);

  // While DOWN, skip the DB: don't wait on a dead pool.
  if (diagnosis.isUp()) {
    try {
      await withTimeout(
        writeAuditLog(prisma, fromPending(event)),
        AUDIT_DB_WRITE_TIMEOUT_MS,
      );
      return;
    } catch {
      /* fall through */
    }
  }

  try {
    await redis.rPush(AUDIT_PENDING_KEY, line);
    return;
  } catch {
    /* fall through */
  }

  console.error(
    `[audit] DB and Redis unavailable, spooling ${event.action} (${event.eventId}) to local file`,
  );
  if (!(await appendToSpool(line))) {
    console.error("[audit] spool full or unwritable, event LOST:", line);
  }
}

// A duplicate eventId means it is already stored: treat as success.
async function insertOnce(event: PendingAuditEvent): Promise<void> {
  try {
    await writeAuditLog(prisma, fromPending(event));
  } catch (err) {
    if ((err as { code?: string }).code !== "P2002") throw err;
  }
}

async function replayRedisItem(raw: string): Promise<void> {
  let event: PendingAuditEvent;
  try {
    event = JSON.parse(raw) as PendingAuditEvent;
  } catch {
    await redis.rPush(AUDIT_DEAD_KEY, raw);
    await redis.lRem(AUDIT_PROCESSING_KEY, 1, raw);
    return;
  }
  await insertOnce(event);
  await redis.lRem(AUDIT_PROCESSING_KEY, 1, raw); // only after the insert succeeded
}

async function drainRedis(): Promise<void> {
  // Leftovers from a crashed drain. Another instance may do the same: harmless (idempotent).
  for (const raw of await redis.lRange(AUDIT_PROCESSING_KEY, 0, -1))
    await replayRedisItem(raw);

  for (let i = 0; i < AUDIT_DRAIN_BATCH; i++) {
    const raw = await redis.lMove(
      AUDIT_PENDING_KEY,
      AUDIT_PROCESSING_KEY,
      "LEFT",
      "RIGHT",
    );
    if (raw === null) return;
    await replayRedisItem(raw);
  }
}

async function drainSpool(): Promise<void> {
  let content: string;
  try {
    content = await readFile(DRAINING_PATH, "utf8"); // resume a previous drain
  } catch {
    try {
      // Rename first so events appended during the drain go to a fresh file.
      await rename(AUDIT_SPOOL_PATH, DRAINING_PATH);
      content = await readFile(DRAINING_PATH, "utf8");
    } catch {
      return; // nothing spooled
    }
  }

  const lines = content.split("\n").filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    let event: PendingAuditEvent;
    try {
      event = JSON.parse(lines[i]) as PendingAuditEvent;
    } catch {
      console.error("[audit] dropping unparseable spool line");
      continue;
    }
    try {
      await insertOnce(event);
    } catch (err) {
      await writeFile(DRAINING_PATH, `${lines.slice(i).join("\n")}\n`); // keep the rest
      throw err;
    }
  }
  await unlink(DRAINING_PATH);
}

let draining = false;

/** Replays buffered events: Redis first, then the local file. Only runs while UP. Never throws. */
export async function drainAuditEvents(): Promise<void> {
  if (draining || !diagnosis.isUp()) return;
  draining = true;
  try {
    await drainRedis();
    await drainSpool();
  } catch (err) {
    console.error(
      "[audit] drain stopped, will retry:",
      err instanceof Error ? err.message : err,
    );
  } finally {
    draining = false;
  }
}

/** Retries periodically, so events buffered while UP (a transient DB error) are not stranded. */
export function startAuditDrain(): () => void {
  const timer = setInterval(
    () => void drainAuditEvents(),
    AUDIT_DRAIN_INTERVAL_MS,
  );
  return () => clearInterval(timer);
}
