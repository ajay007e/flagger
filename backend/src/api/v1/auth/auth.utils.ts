import { timingSafeEqual } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

import { env } from "@/config";
import { AppError, ERROR_CODES } from "@/lib/errors";

import { SETUP_API_KEY_HEADER } from "./auth.constants";

function isEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  // Different lengths leaks only the length, not the content; timingSafeEqual
  // requires equal-length buffers so this check has to come first.
  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

/** Rejects the request unless it carries the correct setup key. Deliberately
 * returns the same UNAUTHENTICATED error whether the header is missing or wrong,
 * so nothing distinguishes the two cases. */
export function requireSetupKey(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const supplied = req.get(SETUP_API_KEY_HEADER);

  if (!supplied || !isEqual(supplied, env.setupApiKey)) {
    next(new AppError(ERROR_CODES.UNAUTHENTICATED));
    return;
  }

  next();
}
