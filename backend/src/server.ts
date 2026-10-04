import { app } from "@/app";
import {
  connectDatabase,
  connectRedis,
  disconnectDatabase,
  disconnectRedis,
  env,
  redis,
} from "@/config";
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
import { flushLogs, getLogger } from "@/lib/logger";

const SHUTDOWN_TIMEOUT_MS = 10_000;
const FLUSH_DELAY_MS = 200;

const processLog = getLogger("process");
const dbLog = getLogger("db");
const redisLog = getLogger("redis");

registerDefaultHealthChecks();
registerDiagnosisAudit();

redis.on("error", (error) =>
  diagnosis.markDown(`redis: ${describeError(error)}`),
);
redis.on("end", () => diagnosis.markDown("redis: connection closed"));

function exitAfterFlush(code: number): void {
  flushLogs();
  setTimeout(() => process.exit(code), FLUSH_DELAY_MS);
}

process.on("unhandledRejection", (reason) => {
  const critical = isCriticalError(reason);

  processLog.error(
    "process.unhandledRejection",
    "Unhandled promise rejection",
    { err: reason, data: { critical } },
  );

  if (critical) diagnosis.markDown("unhandledRejection: critical error");
});

process.on("uncaughtException", (error) => {
  processLog.fatal(
    "process.uncaughtException",
    "Uncaught exception, the process is exiting",
    { err: error },
  );
  exitAfterFlush(1);
});

let stopAuditDrain: (() => void) | undefined;
let shuttingDown = false;

const server = app.listen(env.port, () => {
  processLog.info("process.start", "Server started", {
    data: { port: env.port, pid: process.pid, nodeVersion: process.version },
  });

  startDiagnosisScheduler();
  stopAuditDrain = startAuditDrain();

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

server.on("error", (error) => {
  processLog.fatal(
    "process.listen.failed",
    "Server could not start listening",
    {
      err: error,
      data: { port: env.port },
    },
  );
  exitAfterFlush(1);
});

function shutdown(sig: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;

  processLog.info("process.shutdown", `Received ${sig}, shutting down`, {
    data: { sig },
  });

  const forceTimer = setTimeout(() => {
    processLog.error(
      "process.shutdown.timeout",
      `Shutdown did not finish within ${SHUTDOWN_TIMEOUT_MS}ms, forcing exit`,
    );
    exitAfterFlush(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceTimer.unref();

  stopAuditDrain?.();

  server.close(() => {
    void Promise.allSettled([disconnectDatabase(), disconnectRedis()]).then(
      (results) => {
        const disconnectFailures = results.filter(
          (result) => result.status === "rejected",
        ).length;

        processLog.info("process.shutdown.complete", "Shutdown complete", {
          data: { disconnectFailures },
        });
        exitAfterFlush(0);
      },
    );
  });

  server.closeIdleConnections();
}

for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.on(sig, () => shutdown(sig));
}
