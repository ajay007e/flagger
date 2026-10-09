import { connectDatabase, connectRedis, redis } from "@/config";
import { describeError, diagnosis, runHealthCycle } from "@/lib";
import { getLogger } from "@/lib/logger";

const dbLog = getLogger("db");
const redisLog = getLogger("redis");

export function registerRedisHealthListeners(): void {
  redis.on("error", (error) =>
    diagnosis.markDown(`redis: ${describeError(error)}`),
  );
  redis.on("end", () => diagnosis.markDown("redis: connection closed"));
}

export async function connectDependencies(): Promise<void> {
  await Promise.all([
    connectDatabase().then(
      () => dbLog.info("db.connected", "Connected to MySQL"),
      (error: unknown) =>
        dbLog.error("db.connect.failed", "Could not connect to MySQL", {
          err: error,
        }),
    ),
    connectRedis().then(
      () => redisLog.info("redis.connected", "Connected to Redis"),
      (error: unknown) =>
        redisLog.error("redis.connect.failed", "Could not connect to Redis", {
          err: error,
        }),
    ),
  ]);

  void runHealthCycle();
}
