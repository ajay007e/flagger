import type { NextFunction, Request, Response } from "express";

import {
  cap,
  createLogContext,
  getLogger,
  logContext,
  TRACE_ID_HEADER,
  TRACE_ID_PATTERN,
} from "@/lib/logger";

const log = getLogger("http");

function resolveRoute(req: Request): string {
  return req.route ? `${req.baseUrl}${req.route.path}` : "unmatched";
}

function resolveBodyKeys(req: Request): string[] | undefined {
  const body: unknown = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return undefined;
  }

  const keys = Object.keys(body);

  return keys.length > 0 ? keys : undefined;
}

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = res.locals.requestId as string;
  const supplied = req.get(TRACE_ID_HEADER);
  const traceId =
    supplied && TRACE_ID_PATTERN.test(supplied) ? supplied : requestId;
  const context = createLogContext(traceId, requestId);
  const startedAt = process.hrtime.bigint();
  const elapsedMs = () =>
    Math.round(Number(process.hrtime.bigint() - startedAt) / 1e6);

  logContext.run(context, () => {
    log.info("request.start", `${req.method} request received`, {
      data: {
        method: req.method,
        ip: req.ip,
        userAgent: cap(req.get("user-agent"), 200),
      },
    });

    res.on("finish", () => {
      logContext.run(context, () => {
        const status = res.statusCode;
        const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
        const route = resolveRoute(req);
        const durationMs = elapsedMs();

        log[level](
          "request.finish",
          `${req.method} ${route} completed with ${status} in ${durationMs}ms`,
          {
            data: {
              method: req.method,
              route,
              status,
              durationMs,
              ip: req.ip,
              userAgent: cap(req.get("user-agent"), 200),
              bodyKeys: resolveBodyKeys(req),
              queryCount: context.counters.queryCount,
              dbTimeMs: context.counters.dbTimeMs,
              services: [...new Set(context.counters.services)],
            },
          },
        );
      });
    });

    res.on("close", () => {
      if (res.writableFinished) {
        return;
      }

      logContext.run(context, () => {
        const route = resolveRoute(req);
        const durationMs = elapsedMs();

        log.warn(
          "request.aborted",
          `${req.method} ${route} was closed before a response was sent, after ${durationMs}ms`,
          {
            data: {
              method: req.method,
              route,
              durationMs,
              ip: req.ip,
              userAgent: cap(req.get("user-agent"), 200),
            },
          },
        );
      });
    });

    next();
  });
}
