import { Router } from "express";

import { requireAdmin, requireAuth } from "@/lib/auth";
import {
  asyncHandler,
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware";

import {
  deleteEntity,
  getEntities,
  patchEntity,
  postEntity,
  postRestoreEntity,
} from "./entities.controller";
import {
  createEntitySchema,
  entityParamsSchema,
  listEntitiesQuerySchema,
  projectParamsSchema,
  updateEntitySchema,
} from "./entities.validator";

export const entitiesRouter = Router({ mergeParams: true });

// Admin-only for every route. R6 will relax GET only, once Epic 4 lands.
entitiesRouter.use(requireAuth(), requireAdmin);

entitiesRouter.get(
  "/",
  validateParams(projectParamsSchema),
  validateQuery(listEntitiesQuerySchema),
  asyncHandler(getEntities),
);
entitiesRouter.post(
  "/",
  validateParams(projectParamsSchema),
  validateBody(createEntitySchema),
  asyncHandler(postEntity),
);
entitiesRouter.patch(
  "/:id",
  validateParams(entityParamsSchema),
  validateBody(updateEntitySchema),
  asyncHandler(patchEntity),
);
entitiesRouter.delete(
  "/:id",
  validateParams(entityParamsSchema),
  asyncHandler(deleteEntity),
);
entitiesRouter.post(
  "/:id/restore",
  validateParams(entityParamsSchema),
  asyncHandler(postRestoreEntity),
);
