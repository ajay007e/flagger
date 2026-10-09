import type { NextFunction, Request, Response } from "express";

import {
  AppError,
  DEFAULT_ERROR_MESSAGES,
  describeError,
  diagnosis,
  ERROR_CODES,
  ERROR_STATUS,
  isCriticalError,
  RETRY_AFTER_SECONDS,
  type ErrorCode,
  type ErrorResponse,
} from "@/lib";
import { cap, describeFailure, getLogger, resolveRoute } from "@/lib/logger";

import {
  CLIENT_ERROR_MESSAGES,
  DEFAULT_CLIENT_ERROR_MESSAGE,
} from "../constants";

const log = getLogger("http");

function sendError(
  res: Response,
  status: number,
  code: ErrorCode,
  message: string,
): void {
  const body: ErrorResponse = {
    success: false,
    message,
    code,
    requestId: res.locals.requestId as string | undefined,
  };

  res.status(status).json(body);
}

function getClientError(
  error: unknown,
): { status: number; message: string; type?: string } | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const { status, type } = error as { status?: unknown; type?: unknown };

  if (typeof status !== "number" || status < 400 || status >= 500) {
    return null;
  }

  return {
    status,
    type: typeof type === "string" ? type : undefined,
    message:
      (typeof type === "string" && CLIENT_ERROR_MESSAGES[type]) ||
      DEFAULT_CLIENT_ERROR_MESSAGE,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function describeRequest(req: Request, res: Response) {
  const route = resolveRoute(req, res);
  const unmatched = route === "unmatched";
  const path = unmatched ? cap(req.path, 200) : undefined;

  return {
    target: `${req.method} ${path ?? route}`,
    data: { method: req.method, route, path },
  };
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  const { target, data } = describeRequest(req, res);

  if (error instanceof AppError) {
    if (error.code !== ERROR_CODES.SERVICE_UNAVAILABLE) {
      const serverFault = error.status >= 500;

      log[serverFault ? "error" : "warn"](
        "request.error",
        `${target} failed with ${error.code} (${error.status})`,
        {
          data: {
            ...data,
            status: error.status,
            code: error.code,
            errorType: error.name,
          },
          err: serverFault ? error : undefined,
        },
      );
    }

    sendError(res, error.status, error.code, error.message);
    return;
  }

  if (isCriticalError(error)) {
    diagnosis.markDown(`${req.method} ${req.path}: ${describeError(error)}`);

    log.error(
      "request.error",
      `${target} failed with an infrastructure error and the system was marked DOWN`,
      {
        data: {
          ...data,
          status: ERROR_STATUS.SERVICE_UNAVAILABLE,
          critical: true,
        },
        err: error,
      },
    );

    res.set("Retry-After", String(RETRY_AFTER_SECONDS));
    sendError(
      res,
      ERROR_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.SERVICE_UNAVAILABLE,
      DEFAULT_ERROR_MESSAGES.SERVICE_UNAVAILABLE,
    );
    return;
  }

  const clientError = getClientError(error);

  if (isUniqueViolation(error)) {
    const failure = describeFailure(error);

    log.warn(
      "request.error",
      `${target} failed because a unique constraint was violated`,
      {
        data: {
          ...data,
          status: ERROR_STATUS.CONFLICT,
          code: failure.code,
          errorType: failure.errorType,
        },
      },
    );

    sendError(
      res,
      ERROR_STATUS.CONFLICT,
      ERROR_CODES.CONFLICT,
      DEFAULT_ERROR_MESSAGES.CONFLICT,
    );
    return;
  }

  if (clientError) {
    log.warn(
      "request.error",
      `${target} was rejected with ${clientError.status}`,
      {
        data: {
          ...data,
          status: clientError.status,
          errorType: clientError.type,
        },
      },
    );

    sendError(
      res,
      clientError.status,
      ERROR_CODES.VALIDATION_ERROR,
      clientError.message,
    );
    return;
  }

  log.error("request.error", `Unhandled error while processing ${target}`, {
    data: { ...data, status: ERROR_STATUS.INTERNAL_ERROR },
    err: error,
  });

  sendError(
    res,
    ERROR_STATUS.INTERNAL_ERROR,
    ERROR_CODES.INTERNAL_ERROR,
    DEFAULT_ERROR_MESSAGES.INTERNAL_ERROR,
  );
}
