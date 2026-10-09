import { diagnosis, isCriticalError } from "@/lib";
import { getLogger } from "@/lib/logger";

import { exitAfterFlush } from "./exit";

const log = getLogger("process");

export function registerCrashHandlers(): void {
  process.on("unhandledRejection", (reason) => {
    const critical = isCriticalError(reason);

    log.error("process.unhandledRejection", "Unhandled promise rejection", {
      err: reason,
      data: { critical },
    });

    if (critical) diagnosis.markDown("unhandledRejection: critical error");
  });

  process.on("uncaughtException", (error) => {
    log.fatal(
      "process.uncaughtException",
      "Uncaught exception, the process is exiting",
      { err: error },
    );
    exitAfterFlush(1);
  });
}
