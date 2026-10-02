import { Router } from "express";

import { requireAdmin, requireAuth } from "@/lib/auth";
import {
  asyncHandler,
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware";

import {
  deleteEnvironment,
  getEnvironments,
  patchEnvironment,
  postEnvironment,
  postRestoreEnvironment,
  putEnvironmentOrder,
} from "./environments.controller";
import {
  createEnvironmentSchema,
  environmentParamsSchema,
  listEnvironmentsQuerySchema,
  reorderEnvironmentsSchema,
  updateEnvironmentSchema,
} from "./environments.validator";

export const environmentsRouter = Router();

// Admin-only for every route. R6 will relax GET only, once Epic 4 lands.
environmentsRouter.use(requireAuth(), requireAdmin);

environmentsRouter.get(
  "/",
  validateQuery(listEnvironmentsQuerySchema),
  asyncHandler(getEnvironments),
);
environmentsRouter.post(
  "/",
  validateBody(createEnvironmentSchema),
  asyncHandler(postEnvironment),
);
environmentsRouter.put(
  "/order",
  validateBody(reorderEnvironmentsSchema),
  asyncHandler(putEnvironmentOrder),
);
environmentsRouter.patch(
  "/:id",
  validateParams(environmentParamsSchema),
  validateBody(updateEnvironmentSchema),
  asyncHandler(patchEnvironment),
);
environmentsRouter.delete(
  "/:id",
  validateParams(environmentParamsSchema),
  asyncHandler(deleteEnvironment),
);
environmentsRouter.post(
  "/:id/restore",
  validateParams(environmentParamsSchema),
  asyncHandler(postRestoreEnvironment),
);
