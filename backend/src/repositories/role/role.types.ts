import type { RoleModel, RolePermissionModel } from "@/generated/prisma/models";

export type Role = RoleModel;

export type RoleWithPermissions = RoleModel & {
  permissions: RolePermissionModel[];
};
