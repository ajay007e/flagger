import type { Request, Response } from "express";

import { getRequestMeta } from "@/lib/audit";

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
