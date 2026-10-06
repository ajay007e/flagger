import type { Request, Response } from "express";

import { getRequestMeta } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

import { usersService } from "./users.instrumented";
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
} from "./users.types";

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

export async function patchUser(req: Request, res: Response): Promise<void> {
  const data = await usersService.updateUser(
    Number(req.params.id),
    req.body as UpdateUserInput,
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.json({ success: true, data });
}
