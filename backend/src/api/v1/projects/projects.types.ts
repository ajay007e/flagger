import type { z } from "zod";

import type {
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from "./projects.validator";

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
