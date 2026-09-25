import type { NextFunction, Request, Response } from "express";

import { prisma } from "@/config/db";
import { AppError, ERROR_CODES } from "@/lib/errors";
import type { SessionData } from "@/lib/session";
import { userRepository, type User } from "@/repositories/user";

import type { SessionUser } from "./auth.types";

// Same reasoning as lib/session/session.utils.ts: a local cast instead of
// relying on the ambient `declare module "express-session"` merge, which
// doesn't reliably apply in this project's pnpm setup.
type SessionWithData = Request["session"] & SessionData;

function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
}

function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    type: user.type,
    mustChangePassword: user.mustChangePassword,
  };
}

/**
 * Requires a valid session. Loads the user fresh from the database on every
 * request (no caching in the session itself), so disabling a user, deleting
 * them, or resetting their password takes effect on their very next request.
 *
 * On success, the current user is attached to res.locals.currentUser (read it
 * back with getCurrentUser(res)) — not to req, for the same res.locals reason
 * used for the request id (see src/lib/audit/request-id.ts): it sidesteps
 * ambient Express type augmentation entirely, rather than fighting it again.
 *
 * Opt-in per route (`router.get("/me", requireAuth, handler)`), never
 * registered globally in app.ts — public routes like /auth/login must stay
 * reachable without a session.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = req.session as SessionWithData;

    if (!session.userId) {
      next(new AppError(ERROR_CODES.UNAUTHENTICATED));
      return;
    }

    const user = await userRepository.findById(prisma, session.userId);

    const isValid =
      user !== null &&
      user.isActive &&
      user.sessionVersion === session.sessionVersion;

    if (!isValid) {
      await destroySession(req);
      next(new AppError(ERROR_CODES.SESSION_EXPIRED));
      return;
    }

    res.locals.currentUser = toSessionUser(user);
    next();
  } catch (error) {
    next(error);
  }
}

/** Reads the user attached by requireAuth. Only call this on a route that has
 * requireAuth in its middleware chain — it throws otherwise, on purpose,
 * since silently returning null would be an easy-to-miss bug at the call site. */
export function getCurrentUser(res: Response): SessionUser {
  const user = res.locals.currentUser as SessionUser | undefined;

  if (!user) {
    throw new Error("getCurrentUser called on a route without requireAuth");
  }

  return user;
}
