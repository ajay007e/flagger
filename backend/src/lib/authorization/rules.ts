import type { Request } from "express";

import type { Permission } from "@/lib/permissions";

import type { AccessRule, AccessTarget } from "./types";

export const adminOnly: AccessRule = { kind: "admin" };

export function requires(
  permission: Permission,
  target?: (req: Request) => AccessTarget,
): AccessRule {
  return { kind: "permission", permission, target };
}

export const scoped: AccessRule = { kind: "scoped" };
