import type { z } from "zod";

import type {
  createEntitySchema,
  listEntitiesQuerySchema,
  updateEntitySchema,
} from "./entities.validator";

export type CreateEntityInput = z.infer<typeof createEntitySchema>;
export type UpdateEntityInput = z.infer<typeof updateEntitySchema>;
export type ListEntitiesQuery = z.infer<typeof listEntitiesQuerySchema>;
