import { prisma } from "@/config/db";
import {
  ACTOR_TYPES,
  OUTCOMES,
  writeAuditLog,
  type AuditClient,
  type RequestMeta,
} from "@/lib/audit";
import { AppError, ERROR_CODES } from "@/lib/errors";
import { projectRepository, type Project } from "@/repositories/project";

import { PROJECT_ACTIONS, PROJECT_RESOURCE_TYPE } from "./projects.constants";
import type { CreateProjectInput, UpdateProjectInput } from "./projects.types";

function auditShape(project: Project) {
  return {
    key: project.key,
    name: project.name,
    description: project.description,
    deletedAt: project.deletedAt,
  };
}

// Every project.* row carries projectId, so a non-admin with audit:read can
// later be scoped to their projects (Epic 4).
function audit(
  tx: AuditClient,
  actorId: number,
  action: string,
  project: Project,
  request: RequestMeta,
  diff: { before?: unknown; after?: unknown },
) {
  return writeAuditLog(tx, {
    actorType: ACTOR_TYPES.USER,
    actorId,
    action,
    resourceType: PROJECT_RESOURCE_TYPE,
    resourceId: String(project.id),
    projectId: project.id,
    outcome: OUTCOMES.SUCCESS,
    ...diff,
    request,
  });
}

/**
 * Admin-only today. R6 (non-admins see only projects they can access) needs
 * Epic 4 roles/access: when that lands, filter here by the caller's accessible
 * project ids and relax the router guard on GET only.
 */
export function listProjects(includeDeleted: boolean): Promise<Project[]> {
  return projectRepository.findAll(prisma, { includeDeleted });
}

export function createProject(
  input: CreateProjectInput,
  actorId: number,
  request: RequestMeta,
): Promise<Project> {
  return prisma.$transaction(async (tx) => {
    // Includes soft-deleted rows: a deleted key stays reserved.
    if (await projectRepository.findByKey(tx, input.key)) {
      throw new AppError(ERROR_CODES.CONFLICT, "Project key already in use");
    }

    const project = await projectRepository.create(tx, {
      ...input,
      updatedBy: actorId,
    });

    await audit(tx, actorId, PROJECT_ACTIONS.CREATED, project, request, {
      after: auditShape(project),
    });

    return project;
  });
}

export function updateProject(
  id: number,
  input: UpdateProjectInput,
  actorId: number,
  request: RequestMeta,
): Promise<Project> {
  return prisma.$transaction(async (tx) => {
    const before = await projectRepository.findActiveById(tx, id);

    if (!before) throw new AppError(ERROR_CODES.NOT_FOUND, "Project not found");

    const project = await projectRepository.update(tx, id, {
      ...input,
      updatedBy: actorId,
    });

    await audit(tx, actorId, PROJECT_ACTIONS.UPDATED, project, request, {
      before: auditShape(before),
      after: auditShape(project),
    });

    return project;
  });
}

export function deleteProject(
  id: number,
  actorId: number,
  request: RequestMeta,
): Promise<void> {
  return prisma.$transaction(async (tx) => {
    const before = await projectRepository.findActiveById(tx, id);

    if (!before) throw new AppError(ERROR_CODES.NOT_FOUND, "Project not found");

    const project = await projectRepository.softDelete(tx, id, actorId);

    await audit(tx, actorId, PROJECT_ACTIONS.DELETED, project, request, {
      before: auditShape(before),
      after: auditShape(project),
    });
  });
}

export function restoreProject(
  id: number,
  actorId: number,
  request: RequestMeta,
): Promise<Project> {
  return prisma.$transaction(async (tx) => {
    const before = await projectRepository.findAnyById(tx, id);

    if (!before || !before.deletedAt) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Deleted project not found");
    }

    const project = await projectRepository.restore(tx, id, actorId);

    await audit(tx, actorId, PROJECT_ACTIONS.RESTORED, project, request, {
      before: auditShape(before),
      after: auditShape(project),
    });

    return project;
  });
}
