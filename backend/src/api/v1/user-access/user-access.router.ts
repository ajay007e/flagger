import { Router } from "express";

import { requireAdmin, requireAuth } from "@/lib/auth";
import { asyncHandler, validateBody, validateParams } from "@/middleware";

import { getUserAccess, postUserAccess } from "./user-access.controller";
import {
  assignAccessSchema,
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
