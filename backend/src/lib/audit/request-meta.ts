import type { Request, Response } from "express";

import type { RequestMeta } from "./types";

// x-forwarded-for can be a comma-separated list ("client, proxy1, proxy2"); the
// first entry is the original client. Trusted only because app.ts sets
// `trust proxy` in production (see docs/sessions.md).
function getIpAddress(req: Request): string | null {
  return req.ip ?? null;
}

function getUserAgent(req: Request): string | null {
  const value = req.get("user-agent");

  return value && value.length > 0 ? value : null;
}

/**
 * Builds the request metadata every audit row carries. Call once per audit
 * write (you already have req and res in a route handler). The request id
 * comes from res.locals, set by the requestId middleware.
 */
export function getRequestMeta(req: Request, res: Response): RequestMeta {
  return {
    requestId: res.locals.requestId as string,
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req),
  };
}
