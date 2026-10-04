import type { DbClient } from "../types";
import type { Role, RoleWithPermissions } from "./role.types";

export function findAll(
  client: DbClient,
  options: { includeDeleted: boolean },
): Promise<RoleWithPermissions[]> {
  return client.role.findMany({
    where: options.includeDeleted ? {} : { deletedAt: null },
    include: { permissions: true },
    orderBy: { id: "asc" },
  });
}

export function findActiveById(
  client: DbClient,
  id: number,
): Promise<RoleWithPermissions | null> {
  return client.role.findFirst({
    where: { id, deletedAt: null },
    include: { permissions: true },
  });
}

export function findByKey(client: DbClient, key: string): Promise<Role | null> {
  return client.role.findUnique({ where: { key } });
}
