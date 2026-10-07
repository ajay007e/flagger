import { adminOnly, secureRouter } from "@/lib/authorization";
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

const secure = secureRouter({ mergeParams: true });

export const entitiesRouter = secure.router;

secure.get(
  "/",
  adminOnly,
  validateParams(projectParamsSchema),
  validateQuery(listEntitiesQuerySchema),
  asyncHandler(getEntities),
);
secure.post(
  "/",
  adminOnly,
  validateParams(projectParamsSchema),
  validateBody(createEntitySchema),
  asyncHandler(postEntity),
);
secure.patch(
  "/:id",
  adminOnly,
  validateParams(entityParamsSchema),
  validateBody(updateEntitySchema),
  asyncHandler(patchEntity),
);
secure.delete(
  "/:id",
  adminOnly,
  validateParams(entityParamsSchema),
  asyncHandler(deleteEntity),
);
secure.post(
  "/:id/restore",
  adminOnly,
  validateParams(entityParamsSchema),
  asyncHandler(postRestoreEntity),
);
