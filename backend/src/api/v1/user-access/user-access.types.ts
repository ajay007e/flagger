import type { z } from "zod";

import type { assignAccessSchema } from "./user-access.validator";

export type AssignAccessInput = z.infer<typeof assignAccessSchema>;

export interface UserAccessAssignment {
  assignmentId: string;
  roleId: number;
  projectId: number | null;
  entityIds: number[];
  environmentIds: number[];
}
