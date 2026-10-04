import type { Request, Response } from "express";

import { getRequestMeta } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

import { userAccessService } from "./user-access.instrumented";
import type { AssignAccessInput, UpdateAccessInput } from "./user-access.types";

const userIdOf = (req: Request): number => Number(req.params.userId);
const assignmentIdOf = (req: Request): string =>
  req.params.assignmentId as string;

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

export async function patchUserAccess(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await userAccessService.updateAccess(
    userIdOf(req),
    assignmentIdOf(req),
    req.body as UpdateAccessInput,
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.json({ success: true, data, message: "Access updated" });
}

export async function deleteUserAccess(
  req: Request,
  res: Response,
): Promise<void> {
  await userAccessService.revokeAccess(
    userIdOf(req),
    assignmentIdOf(req),
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.json({ success: true, message: "Access revoked" });
}
