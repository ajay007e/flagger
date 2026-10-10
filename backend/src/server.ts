import { app } from "@/app";
import { env } from "@/config";
import { startAuditDrain, startDiagnosisScheduler } from "@/lib";
import { getLogger } from "@/lib/logger";
import {
  connectDependencies,
  registerProcess,
  registerShutdown,
} from "@/process";

const log = getLogger("process");

registerProcess();

const server = app.listen(env.port, () => {
  log.info("process.start", "Server started", {
    data: { port: env.port, pid: process.pid, nodeVersion: process.version },
  });

  const stopScheduler = startDiagnosisScheduler();
  const stopAuditDrain = startAuditDrain();

  registerShutdown(server, [stopScheduler, stopAuditDrain]);
  void connectDependencies();
});
