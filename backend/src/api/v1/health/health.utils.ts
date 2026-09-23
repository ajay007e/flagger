import { prisma } from "@/config/db";
import { redis } from "@/config/redis";

import { DEPENDENCY_STATUS, HEALTH_CHECK_TIMEOUT_MS } from "./health.constants";
import type { DependencyStatus } from "./health.types";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out after ${ms}ms`)),
      ms,
    );

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// Never rejects: a failed or slow check just resolves to "down", so the health
// endpoint itself never throws (see health.controller.ts).
async function toStatus(check: Promise<unknown>): Promise<DependencyStatus> {
  try {
    await withTimeout(check, HEALTH_CHECK_TIMEOUT_MS);

    return DEPENDENCY_STATUS.UP;
  } catch {
    return DEPENDENCY_STATUS.DOWN;
  }
}

export function checkDatabase(): Promise<DependencyStatus> {
  return toStatus(prisma.$queryRaw`SELECT 1`);
}

export function checkRedis(): Promise<DependencyStatus> {
  return toStatus(redis.ping());
}
