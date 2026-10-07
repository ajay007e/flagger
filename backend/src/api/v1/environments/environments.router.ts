import { adminOnly, scoped, secureRouter } from "@/lib/authorization";
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

const secure = secureRouter();

export const environmentsRouter = secure.router;

secure.get(
  "/",
  scoped,
  validateQuery(listEnvironmentsQuerySchema),
  asyncHandler(getEnvironments),
);
secure.post(
  "/",
  adminOnly,
  validateBody(createEnvironmentSchema),
  asyncHandler(postEnvironment),
);
secure.put(
  "/order",
  adminOnly,
  validateBody(reorderEnvironmentsSchema),
  asyncHandler(putEnvironmentOrder),
);
secure.patch(
  "/:id",
  adminOnly,
  validateParams(environmentParamsSchema),
  validateBody(updateEnvironmentSchema),
  asyncHandler(patchEnvironment),
);
secure.delete(
  "/:id",
  adminOnly,
  validateParams(environmentParamsSchema),
  asyncHandler(deleteEnvironment),
);
secure.post(
  "/:id/restore",
  adminOnly,
  validateParams(environmentParamsSchema),
  asyncHandler(postRestoreEnvironment),
);
