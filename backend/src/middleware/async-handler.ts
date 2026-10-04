import type { NextFunction, Request, RequestHandler, Response } from "express";

import { describeFailure, getLogger } from "@/lib/logger";

const log = getLogger("http");

export function asyncHandler(
  handler: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler {
  const operation = handler.name || "anonymous";

  return (req, res, next) => {
    const startedAt = process.hrtime.bigint();
    const elapsedMs = () =>
      Math.round(Number(process.hrtime.bigint() - startedAt) / 1e6);

    log.debug("controller.enter", `Controller ${operation} started`, {
      data: { layer: "controller", operation },
    });

    handler(req, res, next).then(
      () => {
        const durationMs = elapsedMs();

        log.debug(
          "controller.exit",
          `Controller ${operation} finished successfully in ${durationMs}ms`,
          {
            data: {
              layer: "controller",
              operation,
              outcome: "ok",
              durationMs,
            },
          },
        );
      },
      (error: unknown) => {
        const failure = describeFailure(error);
        const durationMs = elapsedMs();

        log.debug(
          "controller.exit",
          `Controller ${operation} failed after ${durationMs}ms`,
          {
            data: {
              layer: "controller",
              operation,
              outcome: "error",
              durationMs,
              errorType: failure.errorType,
              code: failure.code,
            },
          },
        );

        next(error);
      },
    );
  };
}
