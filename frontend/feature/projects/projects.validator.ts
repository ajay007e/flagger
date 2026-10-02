import { z } from "zod";

import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_KEY_MAX_LENGTH,
  PROJECT_KEY_PATTERN,
  PROJECT_NAME_MAX_LENGTH,
} from "./projects.constants";

export const createProjectSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key is required")
    .max(
      PROJECT_KEY_MAX_LENGTH,
      `Must be at most ${PROJECT_KEY_MAX_LENGTH} characters`,
    )
    .regex(
      PROJECT_KEY_PATTERN,
      "Use lowercase letters, numbers and single dashes only",
    ),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(
      PROJECT_NAME_MAX_LENGTH,
      `Must be at most ${PROJECT_NAME_MAX_LENGTH} characters`,
    ),
  description: z
    .string()
    .trim()
    .max(
      PROJECT_DESCRIPTION_MAX_LENGTH,
      `Must be at most ${PROJECT_DESCRIPTION_MAX_LENGTH} characters`,
    ),
});
