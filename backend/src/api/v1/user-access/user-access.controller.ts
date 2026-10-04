import type { Request, Response } from "express";

import { getRequestMeta } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

import { userAccessService } from "./user-access.instrumented";
import type { AssignAccessInput } from "./user-access.types";

const userIdOf = (req: Request): number => Number(req.params.userId);

export async function getUserAccess(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await userAccessService.listUserAccess(userIdOf(req));

  res.json({ success: true, data });
}

export async function postUserAccess(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await userAccessService.assignAccess(
    userIdOf(req),
    req.body as AssignAccessInput,
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.status(201).json({ success: true, data, message: "Access assigned" });
}
