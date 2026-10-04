import type { NextFunction, Request, Response } from "express";

import { AppError, ERROR_CODES } from "@/lib";

export function notFound(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(new AppError(ERROR_CODES.NOT_FOUND, "Route not found"));
}
