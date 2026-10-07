import { prisma } from "@/config/db";
import type { Permission } from "@/lib/permissions";
import { userAccessRepository } from "@/repositories/user-access";

import { hasAnywhere, isAllowed, ruleAllows } from "./resolver";
import { adminOnly, requires } from "./rules";
import { entityScopeIds, isVisible, scopeIds, type IdScope } from "./scope";
import type {
  AccessGrant,
  AccessRule,
  AccessTarget,
  OverallCapabilities,
} from "./types";

export interface AccessUser {
  id: number;
  type: string;
}

export type AccessDecision = "allowed" | "forbidden" | "hidden";

export interface AccessChecker {
  can(rule: AccessRule, target?: AccessTarget): Promise<boolean>;
}

function loadGrants(user: AccessUser) {
  return userAccessRepository.findActiveGrantsByUserId(prisma, user.id);
}

export function createAccessChecker(user: AccessUser): AccessChecker {
  let grants: Promise<AccessGrant[]> | undefined;

  const load = () => (grants ??= loadGrants(user));

  return {
    async can(rule, target = {}) {
      const needsGrants = rule.kind === "permission" && user.type !== "admin";

      return ruleAllows(rule, user, needsGrants ? await load() : [], target);
    },
  };
}

export function hasPermission(
  user: AccessUser,
  permission: Permission,
  target: AccessTarget = {},
): Promise<boolean> {
  return createAccessChecker(user).can(requires(permission), target);
}

export async function getOverallCapabilities(
  user: AccessUser,
): Promise<OverallCapabilities> {
  const isAdmin = ruleAllows(adminOnly, user, [], {});
  const grants = isAdmin ? [] : await loadGrants(user);
  const has = (permission: Permission) =>
    isAdmin || hasAnywhere(grants, permission);

  return {
    isAdmin,
    canManageUsers: isAdmin,
    canManageCatalog: isAdmin,
    canReadFlags: has("flag:read"),
    canCreateFlags: has("flag:create"),
    canUpdateFlags: has("flag:update"),
    canDeleteFlags: has("flag:delete"),
    canApproveFlags: has("flag:approve"),
    canReadAudit: has("audit:read"),
  };
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
