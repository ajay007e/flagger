import type { Request, Response } from "express";

export function recordRoute(req: Request, res: Response): void {
  if (req.route && res.locals.route === undefined) {
    res.locals.route = `${req.baseUrl}${String(req.route.path)}`;
  }
}

export function resolveRoute(req: Request, res: Response): string {
  const recorded = res.locals.route as string | undefined;

  if (recorded) {
    return recorded;
  }

  return req.route ? `${req.baseUrl}${String(req.route.path)}` : "unmatched";
}
