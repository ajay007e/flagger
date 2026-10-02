import { Router } from "express";

import { requireAdmin, requireAuth } from "@/lib/auth";
import {
  asyncHandler,
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware";

import {
  deleteProject,
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

export const projectsRouter = Router();

// Admin-only for every route. R6 will relax GET only, once Epic 4 lands.
projectsRouter.use(requireAuth(), requireAdmin);

projectsRouter.get(
  "/",
  validateQuery(listProjectsQuerySchema),
  asyncHandler(getProjects),
);
projectsRouter.post(
  "/",
  validateBody(createProjectSchema),
  asyncHandler(postProject),
);
projectsRouter.patch(
  "/:id",
  validateParams(projectParamsSchema),
  validateBody(updateProjectSchema),
  asyncHandler(patchProject),
);
projectsRouter.delete(
  "/:id",
  validateParams(projectParamsSchema),
  asyncHandler(deleteProject),
);
projectsRouter.post(
  "/:id/restore",
  validateParams(projectParamsSchema),
  asyncHandler(postRestoreProject),
);

projectsRouter.use("/:projectId/entities", entitiesRouter);
