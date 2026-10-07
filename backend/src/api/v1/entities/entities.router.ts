import { adminOnlyOn, scoped, secureRouter } from "@/lib/authorization";
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

const onProject = adminOnlyOn((req) => ({
  projectId: Number(req.params.projectId),
}));

const onEntity = adminOnlyOn((req) => ({
  projectId: Number(req.params.projectId),
  entityId: Number(req.params.id),
}));

export const entitiesRouter = secure.router;

secure.get(
  "/",
  scoped,
  validateParams(projectParamsSchema),
  validateQuery(listEntitiesQuerySchema),
  asyncHandler(getEntities),
);
secure.post(
  "/",
  onProject,
  validateParams(projectParamsSchema),
  validateBody(createEntitySchema),
  asyncHandler(postEntity),
);
secure.patch(
  "/:id",
  onEntity,
  validateParams(entityParamsSchema),
  validateBody(updateEntitySchema),
  asyncHandler(patchEntity),
);
secure.delete(
  "/:id",
  onEntity,
  validateParams(entityParamsSchema),
  asyncHandler(deleteEntity),
);
secure.post(
  "/:id/restore",
  onEntity,
  validateParams(entityParamsSchema),
  asyncHandler(postRestoreEntity),
);
