import type { Permission } from "@/lib/permissions";

import { grantHas } from "./resolver";
import type { AccessGrant, AccessTarget } from "./types";

export type IdScope = "all" | number[];

export interface ScopeClause {
  projectId?: number;
  entityId?: number;
  environmentId?: number;
}

export type ScopeWhere = Record<string, never> | { OR: ScopeClause[] };

function grantsWith(
  grants: readonly AccessGrant[],
  permission: Permission,
): AccessGrant[] {
  return grants.filter((grant) => grantHas(grant, permission));
}

function collect(
  grants: readonly AccessGrant[],
  pick: (grant: AccessGrant) => number | null,
): IdScope {
  const ids = new Set<number>();

  for (const grant of grants) {
    const id = pick(grant);

    if (id === null) return "all";

    ids.add(id);
  }

  return [...ids];
}

export function scopeIds(
  grants: readonly AccessGrant[],
  permission: Permission,
  column: "projectId" | "environmentId",
): IdScope {
  return collect(grantsWith(grants, permission), (grant) => grant[column]);
}

export function entityScopeIds(
  grants: readonly AccessGrant[],
  permission: Permission,
  projectId: number,
): IdScope {
  const matching = grantsWith(grants, permission).filter(
    (grant) => grant.projectId === null || grant.projectId === projectId,
  );

  return collect(matching, (grant) => grant.entityId);
}

export function scopeWhere(
  grants: readonly AccessGrant[],
  permission: Permission,
): ScopeWhere {
  const clauses = grantsWith(grants, permission).map((grant) => ({
    ...(grant.projectId !== null && { projectId: grant.projectId }),
    ...(grant.entityId !== null && { entityId: grant.entityId }),
    ...(grant.environmentId !== null && {
      environmentId: grant.environmentId,
    }),
  }));

  if (clauses.some((clause) => Object.keys(clause).length === 0)) return {};

  return { OR: clauses };
}

export function toIdFilter(scope: IdScope): number[] | undefined {
  return scope === "all" ? undefined : scope;
}

export function isVisible(
  grants: readonly AccessGrant[],
  target: AccessTarget,
): boolean {
  const { projectId, entityId, environmentId } = target;

  if (projectId != null) {
    const projects = scopeIds(grants, "flag:read", "projectId");

    if (projects !== "all" && !projects.includes(projectId)) return false;
  }

  if (entityId != null) {
    if (projectId == null) return false;

    const entities = entityScopeIds(grants, "flag:read", projectId);

    if (entities !== "all" && !entities.includes(entityId)) return false;
  }

  if (environmentId != null) {
    const environments = scopeIds(grants, "flag:read", "environmentId");

    if (environments !== "all" && !environments.includes(environmentId)) {
      return false;
    }
  }

  return true;
}
