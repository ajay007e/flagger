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

import {
  CLIENT_ERROR_MESSAGES,
  DEFAULT_CLIENT_ERROR_MESSAGE,
} from "./constants";

function sendError(
  res: Response,
  status: number,
  code: ErrorCode,
  message: string,
): void {
  const body: ErrorResponse = { success: false, message, code };

  res.status(status).json(body);
}

/** Errors raised by Express itself (for example invalid JSON) carry a 4xx `status` and a `type`. */
function getClientError(
  error: unknown,
): { status: number; message: string } | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const { status, type } = error as { status?: unknown; type?: unknown };

  if (typeof status !== "number" || status < 400 || status >= 500) {
    return null;
  }

  return {
    status,
    message:
      (typeof type === "string" && CLIENT_ERROR_MESSAGES[type]) ||
      DEFAULT_CLIENT_ERROR_MESSAGE,
  };
}

// Logged on the server only. The path is logged without the query string.
function logError(req: Request, error: unknown): void {
  console.error(`[error] ${req.method} ${req.path}`, error);
}

/** The single place where every error becomes a response. Register it last. */
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

  if (error instanceof AppError) {
    // The guard's 503 fires on every request while DOWN; don't flood the log.
    if (error.status >= 500 && error.code !== ERROR_CODES.SERVICE_UNAVAILABLE) {
      logError(req, error);
    }

    sendError(res, error.status, error.code, error.message);
    return;
  }

  // Infrastructure failure: block the system now, don't wait for the scheduler.
  if (isCriticalError(error)) {
    diagnosis.markDown(`${req.method} ${req.path}: ${describeError(error)}`);
    logError(req, error);
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
    sendError(
      res,
      ERROR_STATUS.CONFLICT,
      ERROR_CODES.CONFLICT,
      DEFAULT_ERROR_MESSAGES.CONFLICT,
    );
    return;
  }

  if (clientError) {
    sendError(
      res,
      clientError.status,
      ERROR_CODES.VALIDATION_ERROR,
      clientError.message,
    );
    return;
  }

  // Anything else is unexpected: log the real error, send nothing about it.
  logError(req, error);

  sendError(
    res,
    ERROR_STATUS.INTERNAL_ERROR,
    ERROR_CODES.INTERNAL_ERROR,
    DEFAULT_ERROR_MESSAGES.INTERNAL_ERROR,
  );
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}
