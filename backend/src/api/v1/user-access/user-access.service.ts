import { randomUUID } from "node:crypto";

import { prisma } from "@/config/db";
import {
  ACTOR_TYPES,
  OUTCOMES,
  writeAuditLog,
  type RequestMeta,
} from "@/lib/audit";
import { AppError, ERROR_CODES } from "@/lib/errors";
import { getLogger } from "@/lib/logger";
import { entityRepository } from "@/repositories/entity";
import { environmentRepository } from "@/repositories/environment";
import { projectRepository } from "@/repositories/project";
import { roleRepository } from "@/repositories/role";
import { userRepository } from "@/repositories/user";
import type { DbClient } from "@/repositories/types";
import {
  userAccessRepository,
  type FindDuplicateAccessInput,
  type UserAccess,
} from "@/repositories/user-access";

import {
  USER_ACCESS_ACTIONS,
  USER_ACCESS_RESOURCE_TYPE,
} from "./user-access.constants";
import type {
  AssignAccessInput,
  UpdateAccessInput,
  UserAccessAssignment,
} from "./user-access.types";
import { groupByAssignment } from "./user-access.utils";

const log = getLogger("user-access");

function missing(resource: string, id: number): never {
  log.info(
    `access.${resource}.missing`,
    `Access request refused because no active ${resource} matches`,
    { data: { id } },
  );
  throw new AppError(
    ERROR_CODES.NOT_FOUND,
    `${resource.charAt(0).toUpperCase()}${resource.slice(1)} not found`,
  );
}

function rowShape(row: UserAccess) {
  return {
    roleId: row.roleId,
    projectId: row.projectId,
    entityId: row.entityId,
    environmentId: row.environmentId,
  };
}

function audit(
  tx: DbClient,
  actorId: number,
  action: string,
  row: UserAccess,
  request: RequestMeta,
  diff: { before?: unknown; after?: unknown },
) {
  return writeAuditLog(tx, {
    actorType: ACTOR_TYPES.USER,
    actorId,
    action,
    resourceType: USER_ACCESS_RESOURCE_TYPE,
    resourceId: String(row.id),
    projectId: row.projectId ?? undefined,
    entityId: row.entityId ?? undefined,
    environmentId: row.environmentId ?? undefined,
    outcome: OUTCOMES.SUCCESS,
    ...diff,
    metadata: {
      assignmentId: row.assignmentId,
      userId: row.userId,
      roleId: row.roleId,
    },
    request,
  });
}

function missingAssignment(assignmentId: string): never {
  log.info(
    "access.assignment.missing",
    "Access request refused because no active assignment matches",
    { data: { assignmentIdLength: assignmentId.length } },
  );
  throw new AppError(ERROR_CODES.NOT_FOUND, "Assignment not found");
}

async function assertTargets(
  tx: DbClient,
  input: {
    roleId: number;
    projectId: number | null;
    entityIds: number[];
    environmentIds: number[];
  },
): Promise<void> {
  const role = await roleRepository.findActiveById(tx, input.roleId);

  if (!role) {
    return missing("role", input.roleId);
  }

  if (input.projectId !== null) {
    const project = await projectRepository.findActiveById(tx, input.projectId);

    if (!project) {
      return missing("project", input.projectId);
    }
  }

  for (const entityId of input.entityIds) {
    const entity = await entityRepository.findActiveById(
      tx,
      input.projectId as number,
      entityId,
    );

    if (!entity) {
      return missing("entity", entityId);
    }
  }

  for (const environmentId of input.environmentIds) {
    const environment = await environmentRepository.findActiveById(
      tx,
      environmentId,
    );

    if (!environment) {
      return missing("environment", environmentId);
    }
  }
}

function comboKey(entityId: number | null, environmentId: number | null) {
  return `${entityId ?? "all"}:${environmentId ?? "all"}`;
}

async function assertNotDuplicate(
  tx: DbClient,
  input: FindDuplicateAccessInput,
): Promise<void> {
  const duplicate = await userAccessRepository.findActiveDuplicate(tx, input);

  if (duplicate) {
    log.info(
      "access.duplicate.refused",
      "Access request refused because an identical assignment already exists",
      { data: { userId: input.userId, existingRowId: duplicate.id } },
    );
    throw new AppError(ERROR_CODES.CONFLICT, "Access already assigned");
  }
}

export function assignAccess(
  userId: number,
  input: AssignAccessInput,
  actorId: number,
  request: RequestMeta,
): Promise<UserAccessAssignment> {
  return prisma.$transaction(async (tx) => {
    await userRepository.lockById(tx, userId);
    const target = await userRepository.findById(tx, userId);

    if (!target) {
      return missing("user", userId);
    }

    if (target.type !== "user" || !target.isActive) {
      log.info(
        "access.user.refused",
        "Access assignment refused because the target is not an active user of type user",
        {
          data: {
            userId,
            isAdmin: target.type === "admin",
            isActive: target.isActive,
          },
        },
      );
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "userId: access can only be assigned to active users of type user",
      );
    }

    await assertTargets(tx, input);

    for (const environmentId of input.environmentIds) {
      const environment = await environmentRepository.findActiveById(
        tx,
        environmentId,
      );

      if (!environment) {
        return missing("environment", environmentId);
      }
    }

    const entityTargets: (number | null)[] =
      input.entityIds.length > 0 ? input.entityIds : [null];
    const environmentTargets: (number | null)[] =
      input.environmentIds.length > 0 ? input.environmentIds : [null];
    const assignmentId = randomUUID();
    const rows: UserAccess[] = [];

    for (const entityId of entityTargets) {
      for (const environmentId of environmentTargets) {
        await assertNotDuplicate(tx, {
          userId,
          roleId: input.roleId,
          projectId: input.projectId,
          entityId,
          environmentId,
        });
        const row = await userAccessRepository.create(tx, {
          assignmentId,
          userId,
          roleId: input.roleId,
          projectId: input.projectId,
          entityId,
          environmentId,
          updatedBy: actorId,
        });

        await audit(tx, actorId, USER_ACCESS_ACTIONS.ASSIGNED, row, request, {
          after: rowShape(row),
        });
        rows.push(row);
      }
    }

    log.info("access.assigned", "Access assigned", {
      data: {
        userId,
        roleId: input.roleId,
        rowCount: rows.length,
        scopedToProject: input.projectId !== null,
        entityCount: input.entityIds.length,
        environmentCount: input.environmentIds.length,
      },
    });

    return groupByAssignment(rows)[0];
  });
}

export async function listUserAccess(
  userId: number,
): Promise<UserAccessAssignment[]> {
  const target = await userRepository.findById(prisma, userId);

  if (!target) {
    return missing("user", userId);
  }

  const rows = await userAccessRepository.findActiveByUserId(prisma, userId);

  return groupByAssignment(rows);
}

export function updateAccess(
  userId: number,
  assignmentId: string,
  input: UpdateAccessInput,
  actorId: number,
  request: RequestMeta,
): Promise<UserAccessAssignment> {
  return prisma.$transaction(async (tx) => {
    await userRepository.lockById(tx, userId);
    const rows = await userAccessRepository.findActiveByAssignment(
      tx,
      userId,
      assignmentId,
    );

    if (rows.length === 0) {
      return missingAssignment(assignmentId);
    }

    const current = groupByAssignment(rows)[0];
    const roleId = input.roleId ?? current.roleId;
    const entityIds = input.entityIds ?? current.entityIds;
    const environmentIds = input.environmentIds ?? current.environmentIds;

    if (entityIds.length > 0 && current.projectId === null) {
      log.info(
        "access.update.refused",
        "Access update refused because entities need an assignment with a project",
        { data: { userId, entityCount: entityIds.length } },
      );
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "entityIds: requires an assignment with a project",
      );
    }

    await assertTargets(tx, {
      roleId,
      projectId: current.projectId,
      entityIds,
      environmentIds,
    });

    const entityTargets: (number | null)[] =
      entityIds.length > 0 ? entityIds : [null];
    const environmentTargets: (number | null)[] =
      environmentIds.length > 0 ? environmentIds : [null];
    const desired = new Set<string>();

    for (const entityId of entityTargets) {
      for (const environmentId of environmentTargets) {
        desired.add(comboKey(entityId, environmentId));
      }
    }

    const existing = new Set(
      rows.map((row) => comboKey(row.entityId, row.environmentId)),
    );
    const result: UserAccess[] = [];
    let removedCount = 0;
    let addedCount = 0;
    let roleChangedCount = 0;

    for (const row of rows) {
      if (!desired.has(comboKey(row.entityId, row.environmentId))) {
        await userAccessRepository.softDelete(tx, row.id, actorId);
        await audit(tx, actorId, USER_ACCESS_ACTIONS.UPDATED, row, request, {
          before: rowShape(row),
          after: null,
        });
        removedCount += 1;
        continue;
      }

      if (row.roleId !== roleId) {
        await assertNotDuplicate(tx, {
          userId,
          roleId,
          projectId: row.projectId,
          entityId: row.entityId,
          environmentId: row.environmentId,
          excludeAssignmentId: assignmentId,
        });
        const updated = await userAccessRepository.updateRole(
          tx,
          row.id,
          roleId,
          actorId,
        );

        await audit(
          tx,
          actorId,
          USER_ACCESS_ACTIONS.UPDATED,
          updated,
          request,
          {
            before: rowShape(row),
            after: rowShape(updated),
          },
        );
        roleChangedCount += 1;
        result.push(updated);
        continue;
      }

      result.push(row);
    }

    for (const entityId of entityTargets) {
      for (const environmentId of environmentTargets) {
        if (existing.has(comboKey(entityId, environmentId))) continue;
        await assertNotDuplicate(tx, {
          userId,
          roleId,
          projectId: current.projectId,
          entityId,
          environmentId,
          excludeAssignmentId: assignmentId,
        });
        const row = await userAccessRepository.create(tx, {
          assignmentId,
          userId,
          roleId,
          projectId: current.projectId,
          entityId,
          environmentId,
          updatedBy: actorId,
        });

        await audit(tx, actorId, USER_ACCESS_ACTIONS.UPDATED, row, request, {
          before: null,
          after: rowShape(row),
        });
        addedCount += 1;
        result.push(row);
      }
    }

    log.info("access.updated", "Access updated", {
      data: { userId, addedCount, removedCount, roleChangedCount },
    });

    return groupByAssignment(result)[0];
  });
}

export function revokeAccess(
  userId: number,
  assignmentId: string,
  actorId: number,
  request: RequestMeta,
): Promise<void> {
  return prisma.$transaction(async (tx) => {
    const rows = await userAccessRepository.findActiveByAssignment(
      tx,
      userId,
      assignmentId,
    );

    if (rows.length === 0) {
      return missingAssignment(assignmentId);
    }

    for (const row of rows) {
      await userAccessRepository.softDelete(tx, row.id, actorId);
      await audit(tx, actorId, USER_ACCESS_ACTIONS.REVOKED, row, request, {
        before: rowShape(row),
        after: null,
      });
    }

    log.info("access.revoked", "Access revoked", {
      data: { userId, rowCount: rows.length },
    });
  });
}
