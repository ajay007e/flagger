import type { Request, Response } from "express";

import { getRequestMeta } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

import { entitiesService } from "./entities.instrumented";
import type {
  CreateEntityInput,
  ListEntitiesQuery,
  UpdateEntityInput,
} from "./entities.types";

const projectIdOf = (req: Request): number => Number(req.params.projectId);
const idOf = (req: Request): number => Number(req.params.id);

export async function getEntities(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListEntitiesQuery;
  const data = await entitiesService.listEntities(projectIdOf(req), query);

  res.json({ success: true, data });
}

export async function postEntity(req: Request, res: Response): Promise<void> {
  const data = await entitiesService.createEntity(
    projectIdOf(req),
    req.body as CreateEntityInput,
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.status(201).json({ success: true, data, message: "Entity created" });
}

export async function patchEntity(req: Request, res: Response): Promise<void> {
  const data = await entitiesService.updateEntity(
    projectIdOf(req),
    idOf(req),
    req.body as UpdateEntityInput,
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.json({ success: true, data });
}

export async function deleteEntity(req: Request, res: Response): Promise<void> {
  await entitiesService.deleteEntity(
    projectIdOf(req),
    idOf(req),
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.json({ success: true, message: "Entity deleted" });
}

export async function postRestoreEntity(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await entitiesService.restoreEntity(
    projectIdOf(req),
    idOf(req),
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.json({ success: true, data, message: "Entity restored" });
}
