import type { Request, Response } from "express";

import { getRequestMeta } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

import { environmentsService } from "./environments.instrumented";
import type {
  CreateEnvironmentInput,
  ListEnvironmentsQuery,
  ReorderEnvironmentsInput,
  UpdateEnvironmentInput,
} from "./environments.types";

const idOf = (req: Request): number => Number(req.params.id);

export async function getEnvironments(
  req: Request,
  res: Response,
): Promise<void> {
  const { includeDeleted } = req.query as unknown as ListEnvironmentsQuery;
  const data = await environmentsService.listEnvironments(
    includeDeleted,
    getCurrentUser(res),
  );
  res.json({ success: true, data });
}

export async function postEnvironment(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await environmentsService.createEnvironment(
    req.body as CreateEnvironmentInput,
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.status(201).json({ success: true, data, message: "Environment created" });
}

export async function patchEnvironment(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await environmentsService.updateEnvironment(
    idOf(req),
    req.body as UpdateEnvironmentInput,
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.json({ success: true, data });
}

export async function putEnvironmentOrder(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await environmentsService.reorderEnvironments(
    req.body as ReorderEnvironmentsInput,
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.json({ success: true, data });
}

export async function deleteEnvironment(
  req: Request,
  res: Response,
): Promise<void> {
  await environmentsService.deleteEnvironment(
    idOf(req),
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.json({ success: true, message: "Environment deleted" });
}

export async function postRestoreEnvironment(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await environmentsService.restoreEnvironment(
    idOf(req),
    getCurrentUser(res).id,
    getRequestMeta(req, res),
  );

  res.json({ success: true, data, message: "Environment restored" });
}
