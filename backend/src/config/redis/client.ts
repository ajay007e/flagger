import { createClient } from "redis";

import { env } from "@/config";
import { getLogger } from "@/lib/logger";

const log = getLogger("redis");

export const redis = createClient({
  url: env.redisUrl,
  disableOfflineQueue: true,
});

redis.on("connect", () => {
  log.debug("redis.connect", "Redis socket connected");
});

redis.on("ready", () => {
  log.debug("redis.ready", "Redis client is ready to accept commands");
});

redis.on("reconnecting", () => {
  log.warn("redis.reconnecting", "Redis client is trying to reconnect");
});

redis.on("end", () => {
  log.warn("redis.end", "Redis connection closed");
});

redis.on("error", (error) => {
  log.error("redis.error", "Redis client reported an error", { err: error });
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
