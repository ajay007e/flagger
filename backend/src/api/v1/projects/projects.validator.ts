import { z } from "zod";

import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_KEY_MAX_LENGTH,
  PROJECT_KEY_PATTERN,
  PROJECT_NAME_MAX_LENGTH,
} from "./projects.constants";
import { paginationQuerySchema } from "@/lib/pagination";

const description = z
  .string()
  .trim()
  .max(
    PROJECT_DESCRIPTION_MAX_LENGTH,
    `must be at most ${PROJECT_DESCRIPTION_MAX_LENGTH} characters`,
  )
  .nullable()
  .transform((value) => (value === "" ? null : value));

const name = z
  .string()
  .trim()
  .min(1, "is required")
  .max(
    PROJECT_NAME_MAX_LENGTH,
    `must be at most ${PROJECT_NAME_MAX_LENGTH} characters`,
  );

export const createProjectSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "is required")
    .max(
      PROJECT_KEY_MAX_LENGTH,
      `must be at most ${PROJECT_KEY_MAX_LENGTH} characters`,
    )
    .regex(
      PROJECT_KEY_PATTERN,
      "must use lowercase letters, numbers and dashes only",
    ),
  name,
  description: description.optional().transform((value) => value ?? null),
});

// strictObject: sending `key` (or anything unknown) is a validation error,
// because the key is immutable after creation.
export const updateProjectSchema = z
  .strictObject({
    name: name.optional(),
    description: description.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "at least one field is required",
  });

export const projectParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listProjectsQuerySchema = paginationQuerySchema.extend({
  includeDeleted: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});
