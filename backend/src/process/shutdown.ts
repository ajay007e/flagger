import type { Server } from "node:http";

import { disconnectDatabase, disconnectRedis } from "@/config";
import { getLogger } from "@/lib/logger";

import { exitAfterFlush } from "./exit";

const SHUTDOWN_TIMEOUT_MS = 10_000;
const log = getLogger("process");

export function registerShutdown(server: Server, stoppers: Array<() => void>) {
  let shuttingDown = false;

  function shutdown(sig: NodeJS.Signals): void {
    if (shuttingDown) return;
    shuttingDown = true;

    log.info("process.shutdown", `Received ${sig}, shutting down`, {
      data: { sig },
    });

    const forceTimer = setTimeout(() => {
      log.error(
        "process.shutdown.timeout",
        `Shutdown did not finish within ${SHUTDOWN_TIMEOUT_MS}ms, forcing exit`,
      );
      exitAfterFlush(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceTimer.unref();

    for (const stop of stoppers) stop();

    server.close(() => {
      void Promise.allSettled([disconnectDatabase(), disconnectRedis()]).then(
        (results) => {
          const disconnectFailures = results.filter(
            (result) => result.status === "rejected",
          ).length;

          log.info("process.shutdown.complete", "Shutdown complete", {
            data: { disconnectFailures },
          });
          exitAfterFlush(0);
        },
      );
    });
  }

  for (const sig of ["SIGTERM", "SIGINT"] as const) {
    process.on(sig, () => shutdown(sig));
  }
}
