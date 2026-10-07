import type { UserAccessModel } from "@/generated/prisma/models";

export type UserAccess = UserAccessModel;

export interface CreateUserAccessInput {
  assignmentId: string;
  userId: number;
  roleId: number;
  projectId: number | null;
  entityId: number | null;
  environmentId: number | null;
  updatedBy: number;
}

export interface FindDuplicateAccessInput {
  userId: number;
  roleId: number;
  projectId: number | null;
  entityId: number | null;
  environmentId: number | null;
  excludeAssignmentId?: string;
}

export interface UserAccessGrant {
  projectId: number | null;
  entityId: number | null;
  environmentId: number | null;
  permissions: string[];
}
