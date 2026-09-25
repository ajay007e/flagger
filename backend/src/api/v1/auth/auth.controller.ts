import type { Request, Response } from "express";

import { getRequestMeta } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

import * as authService from "./auth.service";
import type { SetupAdminInput } from "./auth.types";

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

/**
 * Requires `requireAuth` earlier in the route's middleware chain — that's
 * what populates the value getCurrentUser reads here. Synchronous (no
 * database call of its own): the user was already loaded by requireAuth.
 */
export function getMe(_req: Request, res: Response): void {
  const user = getCurrentUser(res);

  res.json({ success: true, data: user });
}
