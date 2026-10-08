interface Option {
  id: number;
  key: string;
  name: string;
}

export interface AccessOption extends Option {
  description?: string | null;
}

export interface AvailableAccess {
  projects: AccessOption[];
  environments: AccessOption[];
}

export interface RoleOption extends Option {
  description: string | null;
}

export interface AccessAssignment {
  assignmentId: string;
  roleId: number;
  projectId: number | null;
  entityIds: number[];
  environmentIds: number[];
}

export interface AccessInput {
  roleId: number;
  projectId: number | null;
  entityIds: number[];
  environmentIds: number[];
}

export type UpdateAccessInput = Partial<
  Pick<AccessInput, "roleId" | "entityIds" | "environmentIds">
>;

export interface AccessDraft {
  key: string;
  assignmentId: string | null;
  roleId: number | null;
  projectId: number | null;
  entityIds: number[];
  environmentIds: number[];
}

export type AccessCardField =
  "roleId" | "projectId" | "entityIds" | "environmentIds";

export type AccessCardErrors = Partial<Record<AccessCardField, string>>;

export interface ValidAccessCard {
  assignmentId: string | null;
  input: AccessInput;
}

export type AccessChange =
  | { kind: "revoke"; assignmentId: string }
  | { kind: "update"; assignmentId: string; input: UpdateAccessInput }
  | { kind: "assign"; input: AccessInput };
