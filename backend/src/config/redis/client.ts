import { createClient } from "redis";

import { env } from "@/config/env";
import { getLogger } from "@/lib/logger";

const log = getLogger("redis");

export const redis = createClient({
  url: env.redisUrl,
  disableOfflineQueue: true,
});

const LIFECYCLE_EVENTS = [
  ["connect", "debug", "Redis socket connected"],
  ["ready", "debug", "Redis client is ready to accept commands"],
  ["reconnecting", "warn", "Redis client is trying to reconnect"],
  ["end", "warn", "Redis connection closed"],
] as const;

for (const [event, level, message] of LIFECYCLE_EVENTS) {
  redis.on(event, () => log[level](`redis.${event}`, message));
}

redis.on("error", (error) => {
  log.error("redis.error", "Redis client reported an error", { err: error });
});

export async function connectRedis(): Promise<void> {
  await redis.connect();
  await redis.ping();
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}
