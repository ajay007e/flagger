import type { DbClient } from "../types";
import type { CreateUserAccessInput, UserAccess } from "./user-access.types";

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
