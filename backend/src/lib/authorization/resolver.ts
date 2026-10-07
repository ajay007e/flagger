import {
  isPermission,
  withImpliedPermissions,
  type Permission,
} from "@/lib/permissions";

import type { AccessGrant, AccessTarget } from "./types";

function covers(scope: number | null, target: number | null | undefined) {
  return scope === null || scope === target;
}

export function isAllowed(
  grants: readonly AccessGrant[],
  permission: Permission,
  target: AccessTarget,
): boolean {
  return grants.some((grant) => {
    const granted = withImpliedPermissions(
      grant.permissions.filter(isPermission),
    );

    return (
      granted.includes(permission) &&
      covers(grant.projectId, target.projectId) &&
      covers(grant.entityId, target.entityId) &&
      covers(grant.environmentId, target.environmentId)
    );
  });
}
