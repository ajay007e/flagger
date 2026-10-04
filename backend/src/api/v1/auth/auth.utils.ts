import { timingSafeEqual } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

import { env } from "@/config";
import { AppError, ERROR_CODES } from "@/lib/errors";
import { getLogger, recordRoute } from "@/lib/logger";

import { SETUP_API_KEY_HEADER } from "./auth.constants";

const log = getLogger("auth");

function isEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

export function requireSetupKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  recordRoute(req, res);

  const supplied = req.get(SETUP_API_KEY_HEADER);

  if (!supplied || !isEqual(supplied, env.setupApiKey)) {
    log.warn("auth.denied", "Setup request rejected because of its setup key", {
      data: { reason: supplied ? "setup_key_invalid" : "setup_key_missing" },
    });
    next(new AppError(ERROR_CODES.UNAUTHENTICATED));
    return;
  }

  next();
}
