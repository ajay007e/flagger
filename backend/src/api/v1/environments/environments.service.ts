import { prisma } from "@/config/db";
import {
  ACTOR_TYPES,
  OUTCOMES,
  writeAuditLog,
  type RequestMeta,
} from "@/lib/audit";
import { AppError, ERROR_CODES } from "@/lib/errors";
import { getLogger } from "@/lib/logger";
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
import {
  AccessUser,
  resolveScope,
  toIdFilter,
  WithCapabilities,
  withCatalogCapabilities,
} from "@/lib";

const log = getLogger("environments");

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

export async function listEnvironments(
  includeDeleted: boolean,
  user: AccessUser,
): Promise<WithCapabilities<Environment>[]> {
  const scope = await resolveScope(user, "flag:read", "environmentId");

  const items = await environmentRepository.findAll(prisma, {
    includeDeleted: includeDeleted && user.type === "admin",
    ids: toIdFilter(scope),
  });

  return withCatalogCapabilities(user, items, (environment) => ({
    environmentId: environment.id,
  }));
}

export function createEnvironment(
  input: CreateEnvironmentInput,
  actorId: number,
  request: RequestMeta,
): Promise<Environment> {
  return prisma.$transaction(async (tx) => {
    // Includes soft-deleted rows: a deleted key stays reserved.
    const reserved = await environmentRepository.findByKey(tx, input.key);

    if (reserved) {
      log.info(
        "environment.key.reserved",
        "Environment create refused because the key is already reserved",
        {
          data: {
            environmentId: reserved.id,
            reservedByDeleted: reserved.deletedAt !== null,
          },
        },
      );
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

    if (!before) {
      log.info(
        "environment.lookup.missing",
        "Environment operation refused because no active environment matches",
        { data: { environmentId: id } },
      );
      throw new AppError(ERROR_CODES.NOT_FOUND, "Environment not found");
    }

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
    const sameCount = input.ids.length === activeIds.size;
    const allActive = input.ids.every((id) => activeIds.has(id));

    if (!sameCount || !allActive) {
      log.info(
        "environment.reorder.rejected",
        "Environment reorder rejected because the ids do not match the active environments",
        {
          data: {
            activeCount: activeIds.size,
            receivedCount: input.ids.length,
            distinctCount: new Set(input.ids).size,
            sameCount,
            allActive,
          },
        },
      );
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "ids: must list every active environment exactly once",
      );
    }

    const byId = new Map(active.map((env) => [env.id, env]));
    let movedCount = 0;

    for (const [index, id] of input.ids.entries()) {
      const before = byId.get(id)!;

      if (before.sortOrder === index) continue;

      const env = await environmentRepository.setSortOrder(
        tx,
        id,
        index,
        actorId,
      );

      movedCount += 1;

      await audit(tx, actorId, ENVIRONMENT_ACTIONS.UPDATED, env, request, {
        before: { sortOrder: before.sortOrder },
        after: { sortOrder: env.sortOrder },
      });
    }

    const result = await environmentRepository.findAll(tx, {
      includeDeleted: false,
    });

    log.info("environment.reorder.applied", "Environment order applied", {
      data: { count: input.ids.length, movedCount },
    });

    if (result.length !== input.ids.length) {
      log.error(
        "environment.reorder.invariant",
        "Active environment count changed during reorder",
        { data: { expected: input.ids.length, actual: result.length } },
      );
    }

    return result;
  });
}

export function deleteEnvironment(
  id: number,
  actorId: number,
  request: RequestMeta,
): Promise<void> {
  return prisma.$transaction(async (tx) => {
    const before = await environmentRepository.findActiveById(tx, id);

    if (!before) {
      log.info(
        "environment.lookup.missing",
        "Environment operation refused because no active environment matches",
        { data: { environmentId: id } },
      );
      throw new AppError(ERROR_CODES.NOT_FOUND, "Environment not found");
    }

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
      log.info(
        "environment.restore.refused",
        "Environment restore refused because it was not found or is not deleted",
        {
          data: {
            environmentId: id,
            found: Boolean(before),
            deleted: Boolean(before?.deletedAt),
          },
        },
      );
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Deleted environment not found",
      );
    }

    const env = await environmentRepository.restore(tx, id, actorId);

    if (env.deletedAt !== null) {
      log.error(
        "environment.restore.invariant",
        "Environment is still marked deleted after restore",
        { data: { environmentId: id } },
      );
    }

    await audit(tx, actorId, ENVIRONMENT_ACTIONS.RESTORED, env, request, {
      before: auditShape(before),
      after: auditShape(env),
    });

    return env;
  });
}
