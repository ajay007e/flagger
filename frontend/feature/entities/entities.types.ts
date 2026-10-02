import type { z } from "zod";

import type { createEntitySchema } from "./entities.validator";

export interface Entity {
  id: number;
  projectId: number;
  key: string;
  name: string;
  description: string | null;
  deletedAt: string | null;
}

export type CreateEntityInput = z.infer<typeof createEntitySchema>;
export type UpdateEntityInput = Pick<CreateEntityInput, "name" | "description">;
