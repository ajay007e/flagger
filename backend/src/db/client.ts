import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { env } from "@/config";
import { PrismaClient } from "@/generated/prisma/client";

// One shared client for the whole app.
const adapter = new PrismaMariaDb(env.databaseUrl);

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
