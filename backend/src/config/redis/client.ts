import { createClient } from "redis";

import { env } from "@/config";

// One shared client for the whole app. createClient() does not connect on its
// own; connectRedis() below controls exactly when the first connection happens.
export const redis = createClient({ url: env.redisUrl });

// Logged, not thrown: the client retries in the background and emits "error"
// on every failed attempt. An unhandled "error" event would otherwise crash
// the process.
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
