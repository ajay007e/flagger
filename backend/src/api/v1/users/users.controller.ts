import type { Request, Response } from "express";

import { getRequestMeta } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

import { usersService } from "./users.instrumented";
import type { CreateUserInput } from "./users.types";

export async function postCreateUser(
  req: Request,
  res: Response,
): Promise<void> {
  const input = req.body as CreateUserInput;
  const currentUser = getCurrentUser(res);

  const user = await usersService.createUser(
    input,
    currentUser.id,
    getRequestMeta(req, res),
  );

  res.setHeader("Cache-Control", "no-store");
  res.status(201).json({ success: true, data: user, message: "User created" });
}
