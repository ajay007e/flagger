import type { Request, Response } from "express";

import { prisma } from "@/config/db";
import {
  ACTOR_TYPES,
  getRequestMeta,
  OUTCOMES,
  writeAuditLog,
} from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";
import {
  destroySession,
  establishSession,
  SESSION_COOKIE_NAME,
  type SessionWithData,
} from "@/lib/session";

import { AUTH_ACTIONS } from "./auth.constants";
import * as authService from "./auth.service";
import type { LoginInput, LoginResponse, SetupAdminInput } from "./auth.types";

export async function postSetupAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const input = req.body as SetupAdminInput;

  const admin = await authService.setupAdmin(input, getRequestMeta(req, res));

  res.status(201).json({
    success: true,
    data: admin,
    message: "Admin created",
  });
}

export async function postLogin(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;

  const { sessionVersion, ...user } = await authService.login(
    input,
    getRequestMeta(req, res),
  );

  // Regenerates the session id and stores { userId, sessionVersion } before
  // the response is sent, so the session cookie set on this response is
  // already valid for the next request.
  await establishSession(req, { id: user.id, sessionVersion });

  const response: LoginResponse = user;

  res.json({ success: true, data: response });
}

/**
 * Requires `requireAuth` earlier in the route's middleware chain — that's
 * what populates the value getCurrentUser reads here. Synchronous (no
 * database call of its own): the user was already loaded by requireAuth.
 */
export function getMe(_req: Request, res: Response): void {
  const user = getCurrentUser(res);

  res.json({ success: true, data: user });
}

/**
 * No requireAuth in this route's chain on purpose: logout must succeed even
 * with no session (an already-expired or nonexistent one), so it can't reject
 * with UNAUTHENTICATED first. The userId is read directly off the session,
 * before it's destroyed, only to decide whether there's anything to audit.
 */
export async function postLogout(req: Request, res: Response): Promise<void> {
  const session = req.session as SessionWithData;
  const userId = session.userId;

  await destroySession(req);
  res.clearCookie(SESSION_COOKIE_NAME);

  if (userId) {
    await writeAuditLog(prisma, {
      actorType: ACTOR_TYPES.USER,
      actorId: userId,
      action: AUTH_ACTIONS.LOGOUT,
      resourceType: "user",
      resourceId: String(userId),
      outcome: OUTCOMES.SUCCESS,
      request: getRequestMeta(req, res),
    });
  }

  res.json({ success: true, message: "Logged out" });
}
