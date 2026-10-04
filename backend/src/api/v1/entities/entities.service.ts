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
import { entityRepository, type Entity } from "@/repositories/entity";
import { projectRepository } from "@/repositories/project";

import { ENTITY_ACTIONS, ENTITY_RESOURCE_TYPE } from "./entities.constants";
import type { CreateEntityInput, UpdateEntityInput } from "./entities.types";

const log = getLogger("entities");

function auditShape(entity: Entity) {
  return {
    projectId: entity.projectId,
    key: entity.key,
    name: entity.name,
    description: entity.description,
    deletedAt: entity.deletedAt,
  };
}

// Every entity.* row carries projectId and entityId, so a non-admin with
// audit:read can later be scoped to their projects/entities (Epic 4).
function audit(
  tx: AuditClient,
  actorId: number,
  action: string,
  entity: Entity,
  request: RequestMeta,
  diff: { before?: unknown; after?: unknown },
) {
  return writeAuditLog(tx, {
    actorType: ACTOR_TYPES.USER,
    actorId,
    action,
    resourceType: ENTITY_RESOURCE_TYPE,
    resourceId: String(entity.id),
    projectId: entity.projectId,
    entityId: entity.id,
    outcome: OUTCOMES.SUCCESS,
    ...diff,
    request,
  });
}

/** Every entity route needs an active parent project. */
async function assertProjectActive(
  tx: AuditClient,
  projectId: number,
): Promise<void> {
  if (!(await projectRepository.findActiveById(tx, projectId))) {
    log.info(
      "entity.parent.inactive",
      "Entity operation refused because the parent project is missing or deleted",
      { data: { projectId, projectActive: false } },
    );
    throw new AppError(ERROR_CODES.NOT_FOUND, "Project not found");
  }
}

/**
 * Admin-only today. R6 (non-admins see only entities they can access) needs
 * Epic 4 roles/access: when that lands, filter here by the caller's accessible
 * entity ids and relax the router guard on GET only.
 */
export async function listEntities(
  projectId: number,
  includeDeleted: boolean,
): Promise<Entity[]> {
  await assertProjectActive(prisma, projectId);

  return entityRepository.findByProject(prisma, projectId, { includeDeleted });
}

export function createEntity(
  projectId: number,
  input: CreateEntityInput,
  actorId: number,
  request: RequestMeta,
): Promise<Entity> {
  return prisma.$transaction(async (tx) => {
    await assertProjectActive(tx, projectId);

    // Includes soft-deleted rows: a deleted key stays reserved in the project.
    const reserved = await entityRepository.findByKey(tx, projectId, input.key);

    if (reserved) {
      log.info(
        "entity.key.reserved",
        "Entity create refused because the key is already reserved in the project",
        {
          data: {
            projectId,
            entityId: reserved.id,
            reservedByDeleted: reserved.deletedAt !== null,
          },
        },
      );
      throw new AppError(
        ERROR_CODES.CONFLICT,
        "Entity key already in use in this project",
      );
    }

    const entity = await entityRepository.create(tx, {
      ...input,
      projectId,
      updatedBy: actorId,
    });

    await audit(tx, actorId, ENTITY_ACTIONS.CREATED, entity, request, {
      after: auditShape(entity),
    });

    return entity;
  });
}

export function updateEntity(
  projectId: number,
  id: number,
  input: UpdateEntityInput,
  actorId: number,
  request: RequestMeta,
): Promise<Entity> {
  return prisma.$transaction(async (tx) => {
    await assertProjectActive(tx, projectId);

    const before = await entityRepository.findActiveById(tx, projectId, id);

    if (!before) {
      log.info(
        "entity.lookup.missing",
        "Entity operation refused because no active entity matches",
        { data: { projectId, entityId: id } },
      );
      throw new AppError(ERROR_CODES.NOT_FOUND, "Entity not found");
    }

    const entity = await entityRepository.update(tx, id, {
      ...input,
      updatedBy: actorId,
    });

    await audit(tx, actorId, ENTITY_ACTIONS.UPDATED, entity, request, {
      before: auditShape(before),
      after: auditShape(entity),
    });

    return entity;
  });
}

export function deleteEntity(
  projectId: number,
  id: number,
  actorId: number,
  request: RequestMeta,
): Promise<void> {
  return prisma.$transaction(async (tx) => {
    await assertProjectActive(tx, projectId);

    const before = await entityRepository.findActiveById(tx, projectId, id);

    if (!before) {
      log.info(
        "entity.lookup.missing",
        "Entity operation refused because no active entity matches",
        { data: { projectId, entityId: id } },
      );
      throw new AppError(ERROR_CODES.NOT_FOUND, "Entity not found");
    }

    const entity = await entityRepository.softDelete(tx, id, actorId);

    await audit(tx, actorId, ENTITY_ACTIONS.DELETED, entity, request, {
      before: auditShape(before),
      after: auditShape(entity),
    });
  });
}

export function restoreEntity(
  projectId: number,
  id: number,
  actorId: number,
  request: RequestMeta,
): Promise<Entity> {
  return prisma.$transaction(async (tx) => {
    await assertProjectActive(tx, projectId);

    const before = await entityRepository.findAnyById(tx, projectId, id);

    if (!before || !before.deletedAt) {
      log.info(
        "entity.restore.refused",
        "Entity restore refused because it was not found or is not deleted",
        {
          data: {
            projectId,
            entityId: id,
            found: Boolean(before),
            deleted: Boolean(before?.deletedAt),
          },
        },
      );
      throw new AppError(ERROR_CODES.NOT_FOUND, "Deleted entity not found");
    }

    const entity = await entityRepository.restore(tx, id, actorId);

    if (entity.deletedAt !== null) {
      log.error(
        "entity.restore.invariant",
        "Entity is still marked deleted after restore",
        { data: { projectId, entityId: id } },
      );
    }

    await audit(tx, actorId, ENTITY_ACTIONS.RESTORED, entity, request, {
      before: auditShape(before),
      after: auditShape(entity),
    });

    return entity;
  });
}
