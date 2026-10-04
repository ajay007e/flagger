import type { RequestHandler } from "express";

import { AppError, ERROR_CODES } from "@/lib/errors";
import { getLogger } from "@/lib/logger";

import { GUARD_EXEMPT_PATHS, RETRY_AFTER_SECONDS } from "./diagnosis.constants";
import { diagnosis } from "./diagnosis.service";

const log = getLogger("diagnosis");

export function isDiagnosisExempt(path: string): boolean {
  const p = path.replace(/\/+$/, "");
  return GUARD_EXEMPT_PATHS.some((e) => p === e || p.startsWith(`${e}/`));
}

export const diagnosisGuard: RequestHandler = (req, res, next) => {
  if (diagnosis.isUp() || isDiagnosisExempt(req.path)) return next();

  res.locals.diagnosisBlocked = true;
  res.set("Retry-After", String(RETRY_AFTER_SECONDS));

  log.debug(
    "diagnosis.guard.blocked",
    "Request blocked because the system is DOWN",
    { data: { method: req.method } },
  );

  next(new AppError(ERROR_CODES.SERVICE_UNAVAILABLE));
};
