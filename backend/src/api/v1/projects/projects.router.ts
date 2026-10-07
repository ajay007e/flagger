import {
  adminOnly,
  adminOnlyOn,
  scoped,
  secureRouter,
} from "@/lib/authorization";
import {
  asyncHandler,
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware";

import {
  deleteProject,
  getProject,
  getProjects,
  patchProject,
  postProject,
  postRestoreProject,
} from "./projects.controller";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  projectParamsSchema,
  updateProjectSchema,
} from "./projects.validator";

import { entitiesRouter } from "../entities";

const secure = secureRouter();

const onProject = adminOnlyOn((req) => ({
  projectId: Number(req.params.id),
}));

export const projectsRouter = secure.router;

secure.get(
  "/",
  scoped,
  validateQuery(listProjectsQuerySchema),
  asyncHandler(getProjects),
);
secure.get(
  "/:id",
  scoped,
  validateParams(projectParamsSchema),
  asyncHandler(getProject),
);
secure.post(
  "/",
  adminOnly,
  validateBody(createProjectSchema),
  asyncHandler(postProject),
);
secure.patch(
  "/:id",
  onProject,
  validateParams(projectParamsSchema),
  validateBody(updateProjectSchema),
  asyncHandler(patchProject),
);
secure.delete(
  "/:id",
  onProject,
  validateParams(projectParamsSchema),
  asyncHandler(deleteProject),
);
secure.post(
  "/:id/restore",
  onProject,
  validateParams(projectParamsSchema),
  asyncHandler(postRestoreProject),
);

secure.router.use("/:projectId/entities", entitiesRouter);
