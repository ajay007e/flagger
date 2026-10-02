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

registerDefaultHealthChecks();
registerDiagnosisAudit();

// Instant detection: block the system as soon as the Redis client reports
// trouble, without waiting for a request or the next scheduler cycle.
// These only ever mark DOWN. Recovery stays with the scheduler.
redis.on("error", (error) =>
  diagnosis.markDown(`redis: ${describeError(error)}`),
);
redis.on("end", () => diagnosis.markDown("redis: connection closed"));

// A stray rejection only trips DOWN if it is an infrastructure failure.
// uncaughtException is left to Node's default (crash and restart as DOWN).
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
  if (isCriticalError(reason))
    diagnosis.markDown("unhandledRejection: critical error");
});

function logConnectFailure(error: unknown): void {
  console.error(error instanceof Error ? error.message : error);
}

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);

  // Server is up first so it can serve 503 and the status endpoint.
  // Diagnosis boots DOWN; the scheduler owns the move to UP.
  startDiagnosisScheduler();
  startAuditDrain();

  // Connect in the background. A down dependency must not stop the server.
  void Promise.allSettled([
    connectDatabase().then(() => console.log("Connected to MySQL")),
    connectRedis().then(() => console.log("Connected to Redis")),
  ]).then((results) => {
    results.forEach(
      (r) => r.status === "rejected" && logConnectFailure(r.reason),
    );
    void runHealthCycle(); // recover promptly instead of waiting for the next interval
  });
});
