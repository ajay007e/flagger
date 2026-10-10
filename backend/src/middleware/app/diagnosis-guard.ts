import type { RequestHandler } from "express";

import {
  AppError,
  diagnosis,
  ERROR_CODES,
  isDiagnosisExempt,
  RETRY_AFTER_SECONDS,
} from "@/lib";
import { getLogger } from "@/lib/logger";

const log = getLogger("diagnosis");

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
