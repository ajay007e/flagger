import type { Request } from "express";

import type { Permission } from "@/lib/permissions";

export const ANY = Symbol("ANY");

export interface AccessTarget {
  projectId?: number | null;
  entityId?: number | null;
  environmentId?: number | null | typeof ANY;
}
export interface AccessGrant {
  projectId: number | null;
  entityId: number | null;
  environmentId: number | null;
  permissions: readonly string[];
}

export type AccessRule =
  | { kind: "admin"; visibility?: "hidden" | ((req: Request) => AccessTarget) }
  | { kind: "scoped" }
  | {
      kind: "permission";
      permission: Permission;
      target?: (req: Request) => AccessTarget;
    };

export interface ItemCapabilities {
  canUpdate: boolean;
  canDelete: boolean;
  canRestore: boolean;
}

export type WithCapabilities<T> = T & { capabilities: ItemCapabilities };

export interface OverallCapabilities {
  isAdmin: boolean;
  canManageUsers: boolean;
  canManageCatalog: boolean;
  canReadFlags: boolean;
  canCreateFlags: boolean;
  canUpdateFlags: boolean;
  canDeleteFlags: boolean;
  canApproveFlags: boolean;
  canReadAudit: boolean;
}
