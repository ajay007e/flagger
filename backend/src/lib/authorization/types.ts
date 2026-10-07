import type { Request } from "express";

import type { Permission } from "@/lib/permissions";

export interface AccessTarget {
  projectId?: number | null;
  entityId?: number | null;
  environmentId?: number | null;
}

export interface AccessGrant {
  projectId: number | null;
  entityId: number | null;
  environmentId: number | null;
  permissions: readonly string[];
}

export type AccessRule =
  | { kind: "admin" }
  | { kind: "scoped" }
  | {
      kind: "permission";
      permission: Permission;
      target?: (req: Request) => AccessTarget;
    };
