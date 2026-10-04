import { randomUUID } from "node:crypto";

import {
  createLogContext,
  describeFailure,
  getLogger,
  logContext,
} from "@/lib/logger";

import { diagnosis } from "./diagnosis.service";

const log = getLogger("diagnosis");

export function guardedJob<T>(
  fn: () => Promise<T>,
  name: string = fn.name || "anonymous",
): () => Promise<T | undefined> {
  return () =>
    logContext.run(createLogContext(randomUUID()), async () => {
      if (!diagnosis.isUp()) {
        log.debug(
          "job.skipped",
          `Job ${name} skipped because the system is DOWN`,
          { data: { job: name, skipped: true } },
        );
        return undefined;
      }

      const startedAt = process.hrtime.bigint();

      log.debug("job.start", `Job ${name} started`, {
        data: { job: name, skipped: false },
      });

      try {
        const result = await fn();
        const durationMs = Math.round(
          Number(process.hrtime.bigint() - startedAt) / 1e6,
        );

        log.debug(
          "job.end",
          `Job ${name} finished successfully in ${durationMs}ms`,
          { data: { job: name, outcome: "ok", durationMs } },
        );

        return result;
      } catch (error) {
        const failure = describeFailure(error);
        const durationMs = Math.round(
          Number(process.hrtime.bigint() - startedAt) / 1e6,
        );

        log.warn("job.end", `Job ${name} failed after ${durationMs}ms`, {
          data: {
            job: name,
            outcome: "error",
            durationMs,
            errorType: failure.errorType,
            code: failure.code,
          },
        });

        throw error;
      }
    });
}
