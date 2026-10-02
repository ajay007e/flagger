import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { env } from "@/config/env";
import { PrismaClient } from "@/generated/prisma/client";

// Fail fast on dead sockets after a DB restart instead of hanging.
// allowPublicKeyRetrieval: MySQL 8.4's caching_sha2_password cannot complete a
// full authentication over a non-TLS connection without it, and its auth cache
// is empty after a container restart. Development only: use TLS (ssl=true) in
// production.
const url = new URL(env.databaseUrl);
url.searchParams.set("connectTimeout", "2000");
url.searchParams.set("acquireTimeout", "2000");
url.searchParams.set("socketTimeout", "3000");
url.searchParams.set("allowPublicKeyRetrieval", "true");

// One shared client for the whole app.
const adapter = new PrismaMariaDb(url.toString());

export const prisma = new PrismaClient({ adapter });

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
