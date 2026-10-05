import { Router } from "express";

import { requireAdmin, requireAuth } from "@/lib/auth";
import { asyncHandler, validateBody, validateQuery } from "@/middleware";

import { userAccessRouter } from "../user-access";
import { getUsers, postCreateUser } from "./users.controller";
import { createUserSchema, listUsersQuerySchema } from "./users.validator";

export const usersRouter = Router();

usersRouter.use(requireAuth(), requireAdmin);

usersRouter.get(
  "/",
  validateQuery(listUsersQuerySchema),
  asyncHandler(getUsers),
);

usersRouter.post(
  "/",
  validateBody(createUserSchema),
  asyncHandler(postCreateUser),
);

usersRouter.use("/:userId/access", userAccessRouter);
