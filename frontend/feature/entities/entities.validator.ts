import { z } from "zod";

import {
  ENTITY_DESCRIPTION_MAX_LENGTH,
  ENTITY_KEY_MAX_LENGTH,
  ENTITY_KEY_PATTERN,
  ENTITY_NAME_MAX_LENGTH,
} from "./entities.constants";

export const createEntitySchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key is required")
    .max(
      ENTITY_KEY_MAX_LENGTH,
      `Must be at most ${ENTITY_KEY_MAX_LENGTH} characters`,
    )
    .regex(
      ENTITY_KEY_PATTERN,
      "Use lowercase letters, numbers and single dashes only",
    ),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(
      ENTITY_NAME_MAX_LENGTH,
      `Must be at most ${ENTITY_NAME_MAX_LENGTH} characters`,
    ),
  description: z
    .string()
    .trim()
    .max(
      ENTITY_DESCRIPTION_MAX_LENGTH,
      `Must be at most ${ENTITY_DESCRIPTION_MAX_LENGTH} characters`,
    ),
});
