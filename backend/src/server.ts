import { app } from "@/app";
import { connectDatabase, connectRedis, env, redis } from "@/config";
import {
  describeError,
  diagnosis,
  isCriticalError,
  registerDefaultHealthChecks,
  registerDiagnosisAudit,
  runHealthCycle,
  startAuditDrain,
  startDiagnosisScheduler,
} from "@/lib";
import { getLogger } from "@/lib/logger";

const processLog = getLogger("process");
const dbLog = getLogger("db");
const redisLog = getLogger("redis");

registerDefaultHealthChecks();
registerDiagnosisAudit();

redis.on("error", (error) =>
  diagnosis.markDown(`redis: ${describeError(error)}`),
);
redis.on("end", () => diagnosis.markDown("redis: connection closed"));

process.on("unhandledRejection", (reason) => {
  const critical = isCriticalError(reason);

  processLog.error(
    "process.unhandledRejection",
    "Unhandled promise rejection",
    { err: reason, data: { critical } },
  );

  if (critical) diagnosis.markDown("unhandledRejection: critical error");
});

app.listen(env.port, () => {
  processLog.info("process.start", "Server started", {
    data: { port: env.port },
  });

  startDiagnosisScheduler();
  startAuditDrain();

  void Promise.all([
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
  ]).then(() => {
    void runHealthCycle();
  });
});
