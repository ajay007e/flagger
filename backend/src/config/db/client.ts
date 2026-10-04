import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { env } from "@/config/env";
import { PrismaClient } from "@/generated/prisma/client";
import { getLogger, logContext } from "@/lib/logger";

const log = getLogger("db");

const url = new URL(env.databaseUrl);
url.searchParams.set("connectTimeout", "2000");
url.searchParams.set("acquireTimeout", "2000");
url.searchParams.set("socketTimeout", "3000");
url.searchParams.set("allowPublicKeyRetrieval", "true");

const adapter = new PrismaMariaDb(url.toString());

export const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "warn" },
    { emit: "event", level: "error" },
  ],
});

prisma.$on("query", (event) => {
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
    return;
  }

  if (event.duration >= env.slowQueryWarnMs) {
    log.warn(
      "db.query.slow",
      `Database query took ${durationMs}ms, above the ${env.slowQueryWarnMs}ms slow threshold`,
      { data },
    );
    return;
  }

  log.trace("db.query", `Database query completed in ${durationMs}ms`, {
    data,
  });
});

prisma.$on("warn", (event) => {
  log.warn("db.warn", "Prisma reported a warning", {
    data: { target: event.target },
  });
});

prisma.$on("error", (event) => {
  log.error("db.error", "Prisma reported an error", {
    data: { target: event.target },
  });
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    throw new Error(
      `Could not connect to MySQL: ${reason}\n` +
        "Check DATABASE_URL in backend/.env and make sure the database is running (pnpm services:up).",
    );
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
