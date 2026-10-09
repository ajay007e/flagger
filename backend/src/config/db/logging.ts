import { env } from "@/config/env";
import type { Prisma } from "@/generated/prisma/client";
import { getLogger, logContext } from "@/lib/logger";

const log = getLogger("db");

export function logQuery(event: Prisma.QueryEvent): void {
  const store = logContext.getStore();

  if (store) {
    store.counters.queryCount += 1;
    store.counters.dbTimeMs += event.duration;
  }

  const durationMs = Math.round(event.duration * 10) / 10;
  const data = { sql: event.query, durationMs };

  if (event.duration >= env.slowQueryErrorMs) {
    log.error(
      "db.query.slow",
      `Database query took ${durationMs}ms, above the ${env.slowQueryErrorMs}ms error threshold`,
      { data },
    );
  } else if (event.duration >= env.slowQueryWarnMs) {
    log.warn(
      "db.query.slow",
      `Database query took ${durationMs}ms, above the ${env.slowQueryWarnMs}ms slow threshold`,
      { data },
    );
  } else {
    log.trace("db.query", `Database query completed in ${durationMs}ms`, {
      data,
    });
  }
}

export function logWarning(event: Prisma.LogEvent): void {
  log.warn("db.warn", "Prisma reported a warning", {
    data: { target: event.target },
  });
}

export function logError(event: Prisma.LogEvent): void {
  log.error("db.error", "Prisma reported an error", {
    data: { target: event.target },
  });
}
