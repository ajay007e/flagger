import { z } from "zod";

export const PERMISSIONS = [
  "flag:read",
  "flag:create",
  "flag:update",
  "flag:delete",
  "flag:approve",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const permissionSchema = z.enum(PERMISSIONS);

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

export function assertPermissions(values: readonly string[]): Permission[] {
  const unknown = values.filter((v) => !isPermission(v));
  if (unknown.length > 0) {
    throw new Error(`Unknown permission(s): ${unknown.join(", ")}`);
  }
  return values as Permission[];
}

export function withImpliedPermissions(
  permissions: readonly Permission[],
): Permission[] {
  const set = new Set<Permission>(permissions);
  if ([...set].some((p) => p.startsWith("flag:"))) set.add("flag:read");
  return [...set];
}
