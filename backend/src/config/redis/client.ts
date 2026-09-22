import { Redis } from "ioredis";

import { env } from "@/config/env";

// One shared client for the whole app.
// lazyConnect: connectRedis() below controls exactly when the first connection happens.
export const redis = new Redis(env.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

// Logged, not thrown: ioredis retries in the background and emits "error" on every
// failed attempt. An unhandled "error" event would otherwise crash the process.
redis.on("error", (error) => {
  console.error("[redis] connection error:", error.message);
});

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
    await redis.ping();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    throw new Error(
      `Could not connect to Redis: ${reason}\n` +
        "Check REDIS_URL in backend/.env and make sure Redis is running (pnpm services:up).",
    );
  }
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}
