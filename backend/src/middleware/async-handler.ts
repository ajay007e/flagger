import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Express 4 does not catch errors thrown in async handlers. Wrapping a handler
 * sends them to the error handler instead of leaving the request hanging.
 *
 *   router.get("/", asyncHandler(async (req, res) => { ... }));
 */
export function asyncHandler(
  handler: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
