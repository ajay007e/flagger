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
import {
  userAccessRepository,
  type UserAccess,
} from "@/repositories/user-access";

import {
  USER_ACCESS_ACTIONS,
  USER_ACCESS_RESOURCE_TYPE,
} from "./user-access.constants";
import type {
  AssignAccessInput,
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

function audit(
  tx: Parameters<typeof writeAuditLog>[0],
  actorId: number,
  row: UserAccess,
  request: RequestMeta,
) {
  return writeAuditLog(tx, {
    actorType: ACTOR_TYPES.USER,
    actorId,
    action: USER_ACCESS_ACTIONS.ASSIGNED,
    resourceType: USER_ACCESS_RESOURCE_TYPE,
    resourceId: String(row.id),
    projectId: row.projectId ?? undefined,
    entityId: row.entityId ?? undefined,
    environmentId: row.environmentId ?? undefined,
    outcome: OUTCOMES.SUCCESS,
    after: {
      roleId: row.roleId,
      projectId: row.projectId,
      entityId: row.entityId,
      environmentId: row.environmentId,
    },
    metadata: {
      assignmentId: row.assignmentId,
      userId: row.userId,
      roleId: row.roleId,
    },
    request,
  });
}

export function assignAccess(
  userId: number,
  input: AssignAccessInput,
  actorId: number,
  request: RequestMeta,
): Promise<UserAccessAssignment> {
  return prisma.$transaction(async (tx) => {
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

    const role = await roleRepository.findActiveById(tx, input.roleId);

    if (!role) {
      return missing("role", input.roleId);
    }

    if (input.projectId !== null) {
      const project = await projectRepository.findActiveById(
        tx,
        input.projectId,
      );

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

    const entityTargets: (number | null)[] =
      input.entityIds.length > 0 ? input.entityIds : [null];
    const environmentTargets: (number | null)[] =
      input.environmentIds.length > 0 ? input.environmentIds : [null];
    const assignmentId = randomUUID();
    const rows: UserAccess[] = [];

    for (const entityId of entityTargets) {
      for (const environmentId of environmentTargets) {
        const row = await userAccessRepository.create(tx, {
          assignmentId,
          userId,
          roleId: input.roleId,
          projectId: input.projectId,
          entityId,
          environmentId,
          updatedBy: actorId,
        });

        await audit(tx, actorId, row, request);
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
