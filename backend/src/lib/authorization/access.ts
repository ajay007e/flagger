import { prisma } from "@/config/db";
import type { Permission } from "@/lib/permissions";
import { userAccessRepository } from "@/repositories/user-access";

import { isAllowed } from "./resolver";
import { entityScopeIds, scopeIds, type IdScope } from "./scope";
import type { AccessTarget } from "./types";

export interface AccessUser {
  id: number;
  type: string;
}

export async function hasPermission(
  user: AccessUser,
  permission: Permission,
  target: AccessTarget = {},
): Promise<boolean> {
  if (user.type === "admin") return true;

  const grants = await userAccessRepository.findActiveGrantsByUserId(
    prisma,
    user.id,
  );

  return isAllowed(grants, permission, target);
}

export async function resolveScope(
  user: AccessUser,
  permission: Permission,
  column: "projectId" | "environmentId",
): Promise<IdScope> {
  if (user.type === "admin") return "all";

  const grants = await userAccessRepository.findActiveGrantsByUserId(
    prisma,
    user.id,
  );

  return scopeIds(grants, permission, column);
}

export async function resolveEntityScope(
  user: AccessUser,
  permission: Permission,
  projectId: number,
): Promise<IdScope> {
  if (user.type === "admin") return "all";

  const grants = await userAccessRepository.findActiveGrantsByUserId(
    prisma,
    user.id,
  );

  return entityScopeIds(grants, permission, projectId);
}
