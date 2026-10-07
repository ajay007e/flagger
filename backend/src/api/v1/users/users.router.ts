import { adminOnly, secureRouter } from "@/lib/authorization";
import {
  asyncHandler,
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware";

import { userAccessRouter } from "../user-access";
import {
  deleteUser,
  getUsers,
  patchUser,
  postCreateUser,
  postDisableUser,
  postEnableUser,
  postResetPassword,
  postRestoreUser,
} from "./users.controller";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userParamsSchema,
} from "./users.validator";

const secure = secureRouter();

export const usersRouter = secure.router;

secure.get(
  "/",
  adminOnly,
  validateQuery(listUsersQuerySchema),
  asyncHandler(getUsers),
);
secure.post(
  "/",
  adminOnly,
  validateBody(createUserSchema),
  asyncHandler(postCreateUser),
);
secure.patch(
  "/:id",
  adminOnly,
  validateParams(userParamsSchema),
  validateBody(updateUserSchema),
  asyncHandler(patchUser),
);
secure.post(
  "/:id/disable",
  adminOnly,
  validateParams(userParamsSchema),
  asyncHandler(postDisableUser),
);
secure.post(
  "/:id/enable",
  adminOnly,
  validateParams(userParamsSchema),
  asyncHandler(postEnableUser),
);
secure.post(
  "/:id/reset-password",
  adminOnly,
  validateParams(userParamsSchema),
  asyncHandler(postResetPassword),
);
secure.delete(
  "/:id",
  adminOnly,
  validateParams(userParamsSchema),
  asyncHandler(deleteUser),
);
secure.post(
  "/:id/restore",
  adminOnly,
  validateParams(userParamsSchema),
  asyncHandler(postRestoreUser),
);

secure.router.use("/:userId/access", userAccessRouter);
