import { Router } from "express";

import { requireAdmin, requireAuth } from "@/lib/auth";
import { asyncHandler, validateBody } from "@/middleware";

import { userAccessRouter } from "../user-access";
import { postCreateUser } from "./users.controller";
import { createUserSchema } from "./users.validator";

export const usersRouter = Router();

usersRouter.use(requireAuth(), requireAdmin);

usersRouter.post(
  "/",
  validateBody(createUserSchema),
  asyncHandler(postCreateUser),
);

usersRouter.use("/:userId/access", userAccessRouter);
