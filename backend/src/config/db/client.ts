import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { env } from "@/config/env";
import { PrismaClient } from "@/generated/prisma/client";

import { logError, logQuery, logWarning } from "./logging";

const url = new URL(env.databaseUrl);
url.searchParams.set("connectTimeout", "2000");
url.searchParams.set("acquireTimeout", "2000");
url.searchParams.set("socketTimeout", "3000");
url.searchParams.set("allowPublicKeyRetrieval", "true");

export const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(url.toString()),
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "warn" },
    { emit: "event", level: "error" },
  ],
});

prisma.$on("query", logQuery);
prisma.$on("warn", logWarning);
prisma.$on("error", logError);

export async function connectDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
