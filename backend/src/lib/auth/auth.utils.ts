import type { NextFunction, Request, Response } from "express";

import { prisma } from "@/config/db";
import { AppError, ERROR_CODES } from "@/lib/errors";
import { getLogger, recordRoute, setLogMeta } from "@/lib/logger";
import { destroySession, type SessionWithData } from "@/lib/session";
import { userRepository, type User } from "@/repositories/user";

import type { SessionUser } from "./auth.types";

const authLog = getLogger("auth");
const sessionLog = getLogger("session");

export interface RequireAuthOptions {
  allowPasswordChange?: boolean;
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

export function requireAuth(options: RequireAuthOptions = {}) {
  return async function requireAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      recordRoute(req, res);
      const session = req.session as SessionWithData;

      if (!session.userId) {
        authLog.warn(
          "auth.denied",
          "Request rejected because it has no session",
          { data: { reason: "no_session" } },
        );
        next(new AppError(ERROR_CODES.UNAUTHENTICATED));
        return;
      }

      setLogMeta({
        userId: session.userId,
        sessionVersion: session.sessionVersion,
      });

      const user = await userRepository.findById(prisma, session.userId);

      if (
        !user ||
        !user.isActive ||
        user.sessionVersion !== session.sessionVersion
      ) {
        const reason = !user
          ? "user_missing"
          : !user.isActive
            ? "user_inactive"
            : "version_mismatch";

        sessionLog.warn(
          "session.rejected",
          `Session rejected and destroyed (${reason})`,
          { data: { reason, currentVersion: user?.sessionVersion } },
        );

        await destroySession(req);
        next(new AppError(ERROR_CODES.SESSION_EXPIRED));
        return;
      }

      if (user.mustChangePassword && !options.allowPasswordChange) {
        authLog.warn(
          "auth.denied",
          "Request blocked because the user must change their password",
          { data: { reason: "must_change_password" } },
        );
        next(new AppError(ERROR_CODES.PASSWORD_CHANGE_REQUIRED));
        return;
      }

      res.locals.currentUser = toSessionUser(user);
      setLogMeta({ userType: user.type });
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAdmin(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (getCurrentUser(res).type !== "admin") {
    authLog.warn(
      "auth.denied",
      "Request rejected because the user is not an admin",
      { data: { reason: "not_admin" } },
    );
    next(new AppError(ERROR_CODES.FORBIDDEN));
    return;
  }

  next();
}

export function getCurrentUser(res: Response): SessionUser {
  const user = res.locals.currentUser as SessionUser | undefined;

  if (!user) {
    throw new Error("getCurrentUser called on a route without requireAuth");
  }

  return user;
}
