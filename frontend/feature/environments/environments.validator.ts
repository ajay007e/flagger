import { z } from "zod";

import {
  ENVIRONMENT_DESCRIPTION_MAX_LENGTH,
  ENVIRONMENT_KEY_MAX_LENGTH,
  ENVIRONMENT_KEY_PATTERN,
  ENVIRONMENT_NAME_MAX_LENGTH,
} from "./environments.constants";

// Mirrors the backend's createEnvironmentSchema. The edit form reuses it with
// the key read-only, so only name and description are sent on update.
export const createEnvironmentSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key is required")
    .max(
      ENVIRONMENT_KEY_MAX_LENGTH,
      `Must be at most ${ENVIRONMENT_KEY_MAX_LENGTH} characters`,
    )
    .regex(
      ENVIRONMENT_KEY_PATTERN,
      "Use lowercase letters, numbers and single dashes only",
    ),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(
      ENVIRONMENT_NAME_MAX_LENGTH,
      `Must be at most ${ENVIRONMENT_NAME_MAX_LENGTH} characters`,
    ),
  description: z
    .string()
    .trim()
    .max(
      ENVIRONMENT_DESCRIPTION_MAX_LENGTH,
      `Must be at most ${ENVIRONMENT_DESCRIPTION_MAX_LENGTH} characters`,
    ),
});
