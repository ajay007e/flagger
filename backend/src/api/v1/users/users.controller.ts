import type { Request, Response } from "express";

import { getRequestMeta } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

import { usersService } from "./users.instrumented";
import type { CreateUserInput, ListUsersQuery } from "./users.types";

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

export async function getUsers(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListUsersQuery;
  const data = await usersService.listUsers(query);

  res.json({ success: true, data });
}
