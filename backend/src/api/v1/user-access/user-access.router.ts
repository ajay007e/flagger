import { Router } from "express";

import { requireAdmin, requireAuth } from "@/lib/auth";
import { asyncHandler, validateBody, validateParams } from "@/middleware";

import {
  deleteUserAccess,
  getUserAccess,
  patchUserAccess,
  postUserAccess,
} from "./user-access.controller";

import {
  assignmentParamsSchema,
  assignAccessSchema,
  updateAccessSchema,
  userAccessParamsSchema,
} from "./user-access.validator";

export const userAccessRouter = Router({ mergeParams: true });

userAccessRouter.use(requireAuth(), requireAdmin);

userAccessRouter.get(
  "/",
  validateParams(userAccessParamsSchema),
  asyncHandler(getUserAccess),
);
userAccessRouter.post(
  "/",
  validateParams(userAccessParamsSchema),
  validateBody(assignAccessSchema),
  asyncHandler(postUserAccess),
);

userAccessRouter.patch(
  "/:assignmentId",
  validateParams(assignmentParamsSchema),
  validateBody(updateAccessSchema),
  asyncHandler(patchUserAccess),
);
userAccessRouter.delete(
  "/:assignmentId",
  validateParams(assignmentParamsSchema),
  asyncHandler(deleteUserAccess),
);
