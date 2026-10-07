import { adminOnly, adminOnlyHidden, secureRouter } from "@/lib/authorization";
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
  adminOnlyHidden,
  validateParams(userParamsSchema),
  validateBody(updateUserSchema),
  asyncHandler(patchUser),
);
secure.post(
  "/:id/disable",
  adminOnlyHidden,
  validateParams(userParamsSchema),
  asyncHandler(postDisableUser),
);
secure.post(
  "/:id/enable",
  adminOnlyHidden,
  validateParams(userParamsSchema),
  asyncHandler(postEnableUser),
);
secure.post(
  "/:id/reset-password",
  adminOnlyHidden,
  validateParams(userParamsSchema),
  asyncHandler(postResetPassword),
);
secure.delete(
  "/:id",
  adminOnlyHidden,
  validateParams(userParamsSchema),
  asyncHandler(deleteUser),
);
secure.post(
  "/:id/restore",
  adminOnlyHidden,
  validateParams(userParamsSchema),
  asyncHandler(postRestoreUser),
);

secure.router.use("/:userId/access", userAccessRouter);
