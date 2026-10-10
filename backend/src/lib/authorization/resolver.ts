import {
  isPermission,
  withImpliedPermissions,
  type Permission,
} from "@/lib/permissions";

import {
  ANY,
  type AccessGrant,
  type AccessRule,
  type AccessTarget,
} from "./types";

function covers(scope: number | null, target: number | null | undefined) {
  return scope === null || scope === target;
}

function coversEnvironment(
  scope: number | null,
  target: AccessTarget["environmentId"],
) {
  return target === ANY || covers(scope, target);
}

export function grantHas(grant: AccessGrant, permission: Permission): boolean {
  return withImpliedPermissions(
    grant.permissions.filter(isPermission),
  ).includes(permission);
}

export function hasAnywhere(
  grants: readonly AccessGrant[],
  permission: Permission,
): boolean {
  return grants.some((grant) => grantHas(grant, permission));
}

export function isAllowed(
  grants: readonly AccessGrant[],
  permission: Permission,
  target: AccessTarget,
): boolean {
  return grants.some(
    (grant) =>
      grantHas(grant, permission) &&
      covers(grant.projectId, target.projectId) &&
      covers(grant.entityId, target.entityId) &&
      coversEnvironment(grant.environmentId, target.environmentId),
  );
}

export function ruleAllows(
  rule: AccessRule,
  user: { type: string },
  grants: readonly AccessGrant[],
  target: AccessTarget,
): boolean {
  if (rule.kind === "scoped" || user.type === "admin") return true;
  if (rule.kind === "admin") return false;

  return isAllowed(grants, rule.permission, target);
}
