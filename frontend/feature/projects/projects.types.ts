import type { z } from "zod";

import type { createProjectSchema } from "./projects.validator";

export interface Project {
  id: number;
  key: string;
  name: string;
  description: string | null;
  deletedAt: string | null;
}

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = Pick<
  CreateProjectInput,
  "name" | "description"
>;
