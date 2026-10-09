import { app } from "@/app";
import { env } from "@/config";
import {
  registerDefaultHealthChecks,
  registerDiagnosisAudit,
  startAuditDrain,
  startDiagnosisScheduler,
} from "@/lib";
import { getLogger } from "@/lib/logger";
import {
  connectDependencies,
  exitAfterFlush,
  registerCrashHandlers,
  registerShutdown,
  watchRedis,
} from "@/process";

const log = getLogger("process");

registerDefaultHealthChecks();
registerDiagnosisAudit();
watchRedis();
registerCrashHandlers();

const server = app.listen(env.port, () => {
  log.info("process.start", "Server started", {
    data: { port: env.port, pid: process.pid, nodeVersion: process.version },
  });

  startDiagnosisScheduler();
  registerShutdown(server, startAuditDrain());
  connectDependencies();
});

server.on("error", (error) => {
  log.fatal("process.listen.failed", "Server could not start listening", {
    err: error,
    data: { port: env.port },
  });
  exitAfterFlush(1);
});
