import type { z } from "zod";

import type { createEnvironmentSchema } from "./environments.validator";

export interface Environment {
  id: number;
  key: string;
  name: string;
  description: string | null;
  sortOrder: number;
  deletedAt: string | null;
}

export type CreateEnvironmentInput = z.infer<typeof createEnvironmentSchema>;
export type UpdateEnvironmentInput = Pick<
  CreateEnvironmentInput,
  "name" | "description"
>;
