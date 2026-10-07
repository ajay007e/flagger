import type { DbClient } from "../types";
import type {
  CreateUserAccessInput,
  FindDuplicateAccessInput,
  UserAccess,
  UserAccessGrant,
} from "./user-access.types";

export function create(
  client: DbClient,
  input: CreateUserAccessInput,
): Promise<UserAccess> {
  return client.userAccess.create({
    data: {
      assignmentId: input.assignmentId,
      userId: input.userId,
      roleId: input.roleId,
      projectId: input.projectId,
      entityId: input.entityId,
      environmentId: input.environmentId,
      updatedBy: input.updatedBy,
    },
  });
}

export function findActiveByUserId(
  client: DbClient,
  userId: number,
): Promise<UserAccess[]> {
  return client.userAccess.findMany({
    where: { userId, deletedAt: null },
    orderBy: { id: "asc" },
  });
}

export function findActiveByAssignment(
  client: DbClient,
  userId: number,
  assignmentId: string,
): Promise<UserAccess[]> {
  return client.userAccess.findMany({
    where: { userId, assignmentId, deletedAt: null },
    orderBy: { id: "asc" },
  });
}

export function updateRole(
  client: DbClient,
  id: number,
  roleId: number,
  updatedBy: number,
): Promise<UserAccess> {
  return client.userAccess.update({
    where: { id },
    data: { roleId, updatedBy },
  });
}

export function softDelete(
  client: DbClient,
  id: number,
  updatedBy: number,
): Promise<UserAccess> {
  return client.userAccess.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy },
  });
}

export function findActiveDuplicate(
  client: DbClient,
  input: FindDuplicateAccessInput,
): Promise<UserAccess | null> {
  return client.userAccess.findFirst({
    where: {
      userId: input.userId,
      roleId: input.roleId,
      projectId: input.projectId,
      entityId: input.entityId,
      environmentId: input.environmentId,
      deletedAt: null,
      ...(input.excludeAssignmentId
        ? { assignmentId: { not: input.excludeAssignmentId } }
        : {}),
    },
  });
}

export async function findActiveGrantsByUserId(
  client: DbClient,
  userId: number,
): Promise<UserAccessGrant[]> {
  const rows = await client.userAccess.findMany({
    where: {
      userId,
      deletedAt: null,
      role: { deletedAt: null },
      AND: [
        { OR: [{ projectId: null }, { project: { deletedAt: null } }] },
        { OR: [{ entityId: null }, { entity: { deletedAt: null } }] },
        {
          OR: [{ environmentId: null }, { environment: { deletedAt: null } }],
        },
      ],
    },
    select: {
      projectId: true,
      entityId: true,
      environmentId: true,
      role: { select: { permissions: { select: { permission: true } } } },
    },
  });

  return rows.map((row) => ({
    projectId: row.projectId,
    entityId: row.entityId,
    environmentId: row.environmentId,
    permissions: row.role.permissions.map((p) => p.permission),
  }));
}
