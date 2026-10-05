import { prisma } from "@/config/db";
import {
  ACTOR_TYPES,
  OUTCOMES,
  writeAuditLog,
  type AuditClient,
  type RequestMeta,
} from "@/lib/audit";
import { AppError, ERROR_CODES } from "@/lib/errors";
import { getLogger } from "@/lib/logger";
import { projectRepository, type Project } from "@/repositories/project";

import { PROJECT_ACTIONS, PROJECT_RESOURCE_TYPE } from "./projects.constants";
import type {
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput,
} from "./projects.types";
import { getSkipTake, PaginatedData, toPaginatedData } from "@/lib/pagination";

const log = getLogger("projects");

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

export async function listProjects(
  query: ListProjectsQuery,
): Promise<PaginatedData<Project>> {
  const { items, total } = await projectRepository.findPage(prisma, {
    includeDeleted: query.includeDeleted,
    ...getSkipTake(query),
  });

  return toPaginatedData(items, total, query);
}

export function createProject(
  input: CreateProjectInput,
  actorId: number,
  request: RequestMeta,
): Promise<Project> {
  return prisma.$transaction(async (tx) => {
    // Includes soft-deleted rows: a deleted key stays reserved.
    const reserved = await projectRepository.findByKey(tx, input.key);

    if (reserved) {
      log.info(
        "project.key.reserved",
        "Project create refused because the key is already reserved",
        {
          data: {
            projectId: reserved.id,
            reservedByDeleted: reserved.deletedAt !== null,
          },
        },
      );
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

    if (!before) {
      log.info(
        "project.lookup.missing",
        "Project operation refused because no active project matches",
        { data: { projectId: id } },
      );
      throw new AppError(ERROR_CODES.NOT_FOUND, "Project not found");
    }

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

    if (!before) {
      log.info(
        "project.lookup.missing",
        "Project operation refused because no active project matches",
        { data: { projectId: id } },
      );
      throw new AppError(ERROR_CODES.NOT_FOUND, "Project not found");
    }

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
      log.info(
        "project.restore.refused",
        "Project restore refused because it was not found or is not deleted",
        {
          data: {
            projectId: id,
            found: Boolean(before),
            deleted: Boolean(before?.deletedAt),
          },
        },
      );
      throw new AppError(ERROR_CODES.NOT_FOUND, "Deleted project not found");
    }

    const project = await projectRepository.restore(tx, id, actorId);

    if (project.deletedAt !== null) {
      log.error(
        "project.restore.invariant",
        "Project is still marked deleted after restore",
        { data: { projectId: id } },
      );
    }

    await audit(tx, actorId, PROJECT_ACTIONS.RESTORED, project, request, {
      before: auditShape(before),
      after: auditShape(project),
    });

    return project;
  });
}

export async function getProject(id: number): Promise<Project> {
  const project = await projectRepository.findAnyById(prisma, id);

  if (!project) {
    log.info(
      "project.lookup.missing",
      "Project lookup refused because no project matches",
      { data: { projectId: id } },
    );
    throw new AppError(ERROR_CODES.NOT_FOUND, "Project not found");
  }

  return project;
}
