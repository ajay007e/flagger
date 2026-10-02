import { prisma } from "@/config/db";
import {
  ACTOR_TYPES,
  OUTCOMES,
  writeAuditLog,
  type RequestMeta,
} from "@/lib/audit";
import { AppError, ERROR_CODES } from "@/lib/errors";
import {
  environmentRepository,
  type Environment,
} from "@/repositories/environment";

import {
  ENVIRONMENT_ACTIONS,
  ENVIRONMENT_RESOURCE_TYPE,
} from "./environments.constants";
import type {
  CreateEnvironmentInput,
  ReorderEnvironmentsInput,
  UpdateEnvironmentInput,
} from "./environments.types";

function auditShape(env: Environment) {
  return {
    key: env.key,
    name: env.name,
    description: env.description,
    sortOrder: env.sortOrder,
    deletedAt: env.deletedAt,
  };
}

function audit(
  tx: Parameters<typeof writeAuditLog>[0],
  actorId: number,
  action: string,
  env: Environment,
  request: RequestMeta,
  diff: { before?: unknown; after?: unknown },
) {
  return writeAuditLog(tx, {
    actorType: ACTOR_TYPES.USER,
    actorId,
    action,
    resourceType: ENVIRONMENT_RESOURCE_TYPE,
    resourceId: String(env.id),
    environmentId: env.id,
    outcome: OUTCOMES.SUCCESS,
    ...diff,
    request,
  });
}

/**
 * Admin-only today. R6 (non-admins see only environments they can access)
 * needs Epic 4 roles/access: when that lands, filter here by the caller's
 * accessible environment ids and relax the router guard on GET only.
 */
export function listEnvironments(
  includeDeleted: boolean,
): Promise<Environment[]> {
  return environmentRepository.findAll(prisma, { includeDeleted });
}

export function createEnvironment(
  input: CreateEnvironmentInput,
  actorId: number,
  request: RequestMeta,
): Promise<Environment> {
  return prisma.$transaction(async (tx) => {
    // Includes soft-deleted rows: a deleted key stays reserved.
    if (await environmentRepository.findByKey(tx, input.key)) {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        "Environment key already in use",
      );
    }

    const sortOrder = (await environmentRepository.getMaxSortOrder(tx)) + 1;
    const env = await environmentRepository.create(tx, {
      ...input,
      sortOrder,
      updatedBy: actorId,
    });

    await audit(tx, actorId, ENVIRONMENT_ACTIONS.CREATED, env, request, {
      after: auditShape(env),
    });

    return env;
  });
}

export function updateEnvironment(
  id: number,
  input: UpdateEnvironmentInput,
  actorId: number,
  request: RequestMeta,
): Promise<Environment> {
  return prisma.$transaction(async (tx) => {
    const before = await environmentRepository.findActiveById(tx, id);

    if (!before)
      throw new AppError(ERROR_CODES.NOT_FOUND, "Environment not found");

    const env = await environmentRepository.update(tx, id, {
      ...input,
      updatedBy: actorId,
    });

    await audit(tx, actorId, ENVIRONMENT_ACTIONS.UPDATED, env, request, {
      before: auditShape(before),
      after: auditShape(env),
    });

    return env;
  });
}

export function reorderEnvironments(
  input: ReorderEnvironmentsInput,
  actorId: number,
  request: RequestMeta,
): Promise<Environment[]> {
  return prisma.$transaction(async (tx) => {
    const active = await environmentRepository.findAll(tx, {
      includeDeleted: false,
    });
    const activeIds = new Set(active.map((env) => env.id));

    if (
      input.ids.length !== activeIds.size ||
      !input.ids.every((id) => activeIds.has(id))
    ) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "ids: must list every active environment exactly once",
      );
    }

    const byId = new Map(active.map((env) => [env.id, env]));

    for (const [index, id] of input.ids.entries()) {
      const before = byId.get(id)!;

      if (before.sortOrder === index) continue;

      const env = await environmentRepository.setSortOrder(
        tx,
        id,
        index,
        actorId,
      );

      await audit(tx, actorId, ENVIRONMENT_ACTIONS.UPDATED, env, request, {
        before: { sortOrder: before.sortOrder },
        after: { sortOrder: env.sortOrder },
      });
    }

    return environmentRepository.findAll(tx, { includeDeleted: false });
  });
}

export function deleteEnvironment(
  id: number,
  actorId: number,
  request: RequestMeta,
): Promise<void> {
  return prisma.$transaction(async (tx) => {
    const before = await environmentRepository.findActiveById(tx, id);

    if (!before)
      throw new AppError(ERROR_CODES.NOT_FOUND, "Environment not found");

    const env = await environmentRepository.softDelete(tx, id, actorId);

    await audit(tx, actorId, ENVIRONMENT_ACTIONS.DELETED, env, request, {
      before: auditShape(before),
      after: auditShape(env),
    });
  });
}

export function restoreEnvironment(
  id: number,
  actorId: number,
  request: RequestMeta,
): Promise<Environment> {
  return prisma.$transaction(async (tx) => {
    const before = await environmentRepository.findAnyById(tx, id);

    if (!before || !before.deletedAt) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Deleted environment not found",
      );
    }

    const env = await environmentRepository.restore(tx, id, actorId);

    await audit(tx, actorId, ENVIRONMENT_ACTIONS.RESTORED, env, request, {
      before: auditShape(before),
      after: auditShape(env),
    });

    return env;
  });
}
