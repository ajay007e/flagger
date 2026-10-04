import type { Request, Response } from "express";

import { getRequestMeta } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

import { projectsService } from "./projects.instrumented";
import type {
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput,
} from "./projects.types";

const idOf = (req: Request): number => Number(req.params.id);

export async function getProjects(req: Request, res: Response): Promise<void> {
  const { includeDeleted } = req.query as unknown as ListProjectsQuery;
  const data = await projectsService.listProjects(includeDeleted);

  res.json({ success: true, data });
}

export async function postProject(req: Request, res: Response): Promise<void> {
  const data = await projectsService.createProject(
    req.body as CreateProjectInput,
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.status(201).json({ success: true, data, message: "Project created" });
}

export async function patchProject(req: Request, res: Response): Promise<void> {
  const data = await projectsService.updateProject(
    idOf(req),
    req.body as UpdateProjectInput,
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.json({ success: true, data });
}

export async function deleteProject(
  req: Request,
  res: Response,
): Promise<void> {
  await projectsService.deleteProject(
    idOf(req),
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.json({ success: true, message: "Project deleted" });
}

export async function postRestoreProject(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await projectsService.restoreProject(
    idOf(req),
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.json({ success: true, data, message: "Project restored" });
}
