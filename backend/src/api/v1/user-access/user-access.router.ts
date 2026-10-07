import { adminOnly, secureRouter } from "@/lib/authorization";
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

const secure = secureRouter({ mergeParams: true });

export const userAccessRouter = secure.router;

secure.get(
  "/",
  adminOnly,
  validateParams(userAccessParamsSchema),
  asyncHandler(getUserAccess),
);
secure.post(
  "/",
  adminOnly,
  validateParams(userAccessParamsSchema),
  validateBody(assignAccessSchema),
  asyncHandler(postUserAccess),
);
secure.patch(
  "/:assignmentId",
  adminOnly,
  validateParams(assignmentParamsSchema),
  validateBody(updateAccessSchema),
  asyncHandler(patchUserAccess),
);
secure.delete(
  "/:assignmentId",
  adminOnly,
  validateParams(assignmentParamsSchema),
  asyncHandler(deleteUserAccess),
);
