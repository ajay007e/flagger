import type { Request, Response } from "express";

import { getCurrentUser } from "@/lib/auth";

import { accessService } from "./access.instrumented";

export async function getAvailableAccess(
  _req: Request,
  res: Response,
): Promise<void> {
  const data = await accessService.getAvailableAccess(getCurrentUser(res));

  res.json({ success: true, data });
}
