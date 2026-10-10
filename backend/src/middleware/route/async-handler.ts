import type { NextFunction, Request, RequestHandler, Response } from "express";

import { recordRoute } from "@/lib/logger";

export function asyncHandler(
  handler: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    recordRoute(req, res);
    handler(req, res, next).catch(next);
  };
}
