import { prisma, redis } from "@/config";

import { registerHealthCheck } from "./diagnosis.scheduler";
import type { HealthCheck } from "./diagnosis.types";

export const databaseCheck: HealthCheck = {
  name: "database",
  run: async () => {
    await prisma.$queryRaw`SELECT 1`;
  },
};

export const redisCheck: HealthCheck = {
  name: "redis",
  run: async () => {
    await redis.ping();
  },
};

export function registerDefaultHealthChecks(): void {
  registerHealthCheck(databaseCheck);
  registerHealthCheck(redisCheck);
}
