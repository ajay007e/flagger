import { Router } from "express";

import { requireAdmin, requireAuth } from "@/lib/auth";
import {
  asyncHandler,
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware";

import { userAccessRouter } from "../user-access";
import {
  getUsers,
  patchUser,
  postCreateUser,
  postDisableUser,
  postEnableUser,
  postResetPassword,
} from "./users.controller";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userParamsSchema,
} from "./users.validator";

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

usersRouter.patch(
  "/:id",
  validateParams(userParamsSchema),
  validateBody(updateUserSchema),
  asyncHandler(patchUser),
);

usersRouter.post(
  "/:id/disable",
  validateParams(userParamsSchema),
  asyncHandler(postDisableUser),
);
usersRouter.post(
  "/:id/enable",
  validateParams(userParamsSchema),
  asyncHandler(postEnableUser),
);

usersRouter.post(
  "/:id/reset-password",
  validateParams(userParamsSchema),
  asyncHandler(postResetPassword),
);

usersRouter.use("/:userId/access", userAccessRouter);
