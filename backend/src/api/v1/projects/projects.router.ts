import { adminOnly, secureRouter } from "@/lib/authorization";
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

export const projectsRouter = secure.router;

secure.get(
  "/",
  adminOnly,
  validateQuery(listProjectsQuerySchema),
  asyncHandler(getProjects),
);
secure.get(
  "/:id",
  adminOnly,
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
  adminOnly,
  validateParams(projectParamsSchema),
  validateBody(updateProjectSchema),
  asyncHandler(patchProject),
);
secure.delete(
  "/:id",
  adminOnly,
  validateParams(projectParamsSchema),
  asyncHandler(deleteProject),
);
secure.post(
  "/:id/restore",
  adminOnly,
  validateParams(projectParamsSchema),
  asyncHandler(postRestoreProject),
);

secure.router.use("/:projectId/entities", entitiesRouter);
