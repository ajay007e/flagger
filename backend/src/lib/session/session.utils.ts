import type { Request } from "express";

import type { SessionData } from "./types";

// `declare module "express-session" { interface SessionData ... }` (session.d.ts)
// is the standard way to type req.session.userId, but it doesn't reliably merge
// in this project's pnpm setup (see the same issue with req.requestId in
// src/lib/audit/request-id.ts). This local cast sidesteps that: it doesn't rely
// on the ambient augmentation, so it works regardless of whether that merges.
// Exported so callers (e.g. lib/auth) don't each redefine the same cast.
export type SessionWithData = Request["session"] & SessionData;

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

/**
 * Logs a user into the current request's session: regenerates the session id
 * first, then stores the user, so a session fixation attack can never reuse a
 * pre-existing session id with a new identity. Only userId and sessionVersion
 * are ever stored (see docs/sessions.md); nothing else goes in the session.
 */
export async function establishSession(
  req: Request,
  user: { id: number; sessionVersion: number },
): Promise<void> {
  await regenerateSession(req);

  const session = req.session as SessionWithData;

  session.userId = user.id;
  session.sessionVersion = user.sessionVersion;

  await saveSession(req);
}

/**
 * Ends the current request's session: removes it from the store (Redis) and
 * clears req.session in memory. Safe to call even when there was no session
 * to begin with (e.g. a logout call with no cookie) — destroying an already-
 * nonexistent store record is a no-op, not an error.
 */
export function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
}
