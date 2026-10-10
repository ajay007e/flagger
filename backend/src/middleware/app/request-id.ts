import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

import { REQUEST_ID_HEADER, REQUEST_ID_PATTERN } from "@/lib";

export function requestId(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const supplied = req.get(REQUEST_ID_HEADER);
  const id =
    supplied && REQUEST_ID_PATTERN.test(supplied) ? supplied : randomUUID();

  res.locals.requestId = id;
  res.setHeader(REQUEST_ID_HEADER, id);

  next();
}
