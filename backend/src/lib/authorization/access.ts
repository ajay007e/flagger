import { prisma } from "@/config/db";
import type { Permission } from "@/lib/permissions";
import { userAccessRepository } from "@/repositories/user-access";

import { isAllowed } from "./resolver";
import { entityScopeIds, isVisible, scopeIds, type IdScope } from "./scope";
import type { AccessTarget } from "./types";

export interface AccessUser {
  id: number;
  type: string;
}

export type AccessDecision = "allowed" | "forbidden" | "hidden";

function loadGrants(user: AccessUser) {
  return userAccessRepository.findActiveGrantsByUserId(prisma, user.id);
}

export async function hasPermission(
  user: AccessUser,
  permission: Permission,
  target: AccessTarget = {},
): Promise<boolean> {
  if (user.type === "admin") return true;

  return isAllowed(await loadGrants(user), permission, target);
}

export async function decide(
  user: AccessUser,
  permission: Permission,
  target: AccessTarget = {},
): Promise<AccessDecision> {
  if (user.type === "admin") return "allowed";

  const grants = await loadGrants(user);

  if (isAllowed(grants, permission, target)) return "allowed";

  return isVisible(grants, target) ? "forbidden" : "hidden";
}

export async function canSee(
  user: AccessUser,
  target: AccessTarget,
): Promise<boolean> {
  if (user.type === "admin") return true;

  return isVisible(await loadGrants(user), target);
}

export async function resolveScope(
  user: AccessUser,
  permission: Permission,
  column: "projectId" | "environmentId",
): Promise<IdScope> {
  if (user.type === "admin") return "all";

  return scopeIds(await loadGrants(user), permission, column);
}

export async function resolveEntityScope(
  user: AccessUser,
  permission: Permission,
  projectId: number,
): Promise<IdScope> {
  if (user.type === "admin") return "all";

  return entityScopeIds(await loadGrants(user), permission, projectId);
}
