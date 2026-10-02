import type { z } from "zod";

import type {
  createEnvironmentSchema,
  listEnvironmentsQuerySchema,
  reorderEnvironmentsSchema,
  updateEnvironmentSchema,
} from "./environments.validator";

export type CreateEnvironmentInput = z.infer<typeof createEnvironmentSchema>;
export type UpdateEnvironmentInput = z.infer<typeof updateEnvironmentSchema>;
export type ReorderEnvironmentsInput = z.infer<
  typeof reorderEnvironmentsSchema
>;
export type ListEnvironmentsQuery = z.infer<typeof listEnvironmentsQuerySchema>;
