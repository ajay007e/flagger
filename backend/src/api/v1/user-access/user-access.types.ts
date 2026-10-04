import type { z } from "zod";

import type {
  assignAccessSchema,
  updateAccessSchema,
} from "./user-access.validator";

export type AssignAccessInput = z.infer<typeof assignAccessSchema>;
export type UpdateAccessInput = z.infer<typeof updateAccessSchema>;

export interface UserAccessAssignment {
  assignmentId: string;
  roleId: number;
  projectId: number | null;
  entityIds: number[];
  environmentIds: number[];
}
