import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

import { REQUEST_ID_HEADER } from "./constants";

/**
 * Assigns a request id to every request: a client-supplied `x-request-id` if
 * present, otherwise a generated one. Stored on `res.locals` (already typed by
 * @types/express as Record<string, any>, so no ambient type augmentation is
 * needed) and echoed back as a response header so a client can correlate its
 * request with server-side logs and audit rows. Register before the routes.
 */
export function requestId(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const supplied = req.get(REQUEST_ID_HEADER);
  const id = supplied && supplied.length > 0 ? supplied : randomUUID();

  res.locals.requestId = id;
  res.setHeader(REQUEST_ID_HEADER, id);

  next();
}
