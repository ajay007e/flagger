import type { RequestHandler } from "express";
import {
  DIAGNOSIS_PUBLIC_MESSAGE,
  GUARD_EXEMPT_PATHS,
  RETRY_AFTER_SECONDS,
} from "./diagnosis.constants";
import { diagnosis } from "./diagnosis.service";

/** Read-only. Mount after cors, before session. Changes no state. */
export const diagnosisGuard: RequestHandler = (req, res, next) => {
  if (diagnosis.isUp()) return next();
  if (GUARD_EXEMPT_PATHS.includes(req.originalUrl.split("?")[0])) return next();

  res.set("Retry-After", String(RETRY_AFTER_SECONDS));
  // Envelope is a placeholder until I see error-handler.ts
  res
    .status(503)
    .json({
      error: { code: "SERVICE_UNAVAILABLE", message: DIAGNOSIS_PUBLIC_MESSAGE },
    });
};
