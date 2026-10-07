import type { Request, Response } from "express";

import { prisma } from "@/config/db";
import {
  ACTOR_TYPES,
  getRequestMeta,
  OUTCOMES,
  writeAuditLog,
} from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";
import { getOverallCapabilities, NO_CAPABILITIES } from "@/lib/authorization";
import {
  destroySession,
  establishSession,
  SESSION_COOKIE_NAME,
  type SessionWithData,
} from "@/lib/session";

import { AUTH_ACTIONS } from "./auth.constants";
import { authService } from "./auth.instrumented";
import type {
  ChangePasswordInput,
  LoginInput,
  LoginResponse,
  SetupAdminInput,
} from "./auth.types";

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

  await establishSession(req, { id: user.id, sessionVersion });

  const response: LoginResponse = user;

  res.json({ success: true, data: response });
}

export async function getMe(_req: Request, res: Response): Promise<void> {
  const user = getCurrentUser(res);
  const capabilities = user.mustChangePassword
    ? NO_CAPABILITIES
    : await getOverallCapabilities(user);

  res.json({ success: true, data: { ...user, capabilities } });
}

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

export async function postChangePassword(
  req: Request,
  res: Response,
): Promise<void> {
  const input = req.body as ChangePasswordInput;
  const currentUser = getCurrentUser(res);

  const { sessionVersion } = await authService.changePassword(
    currentUser.id,
    input,
    getRequestMeta(req, res),
  );

  await establishSession(req, { id: currentUser.id, sessionVersion });

  res.json({ success: true, message: "Password changed" });
}
