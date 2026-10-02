import type { RequestHandler } from "express";

import { AppError, ERROR_CODES } from "@/lib/errors";

import { GUARD_EXEMPT_PATHS, RETRY_AFTER_SECONDS } from "./diagnosis.constants";
import { diagnosis } from "./diagnosis.service";

/** Health and diagnosis stay reachable while DOWN. They need no session. */
export function isDiagnosisExempt(path: string): boolean {
  const p = path.replace(/\/+$/, "");
  return GUARD_EXEMPT_PATHS.some((e) => p === e || p.startsWith(`${e}/`));
}

/** Read-only. Mount after cors, before session. Changes no state. */
export const diagnosisGuard: RequestHandler = (req, res, next) => {
  if (diagnosis.isUp() || isDiagnosisExempt(req.path)) return next();

  res.set("Retry-After", String(RETRY_AFTER_SECONDS));
  next(new AppError(ERROR_CODES.SERVICE_UNAVAILABLE));
};
