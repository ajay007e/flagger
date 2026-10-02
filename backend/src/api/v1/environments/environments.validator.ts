import { z } from "zod";

import {
  ENVIRONMENT_DESCRIPTION_MAX_LENGTH,
  ENVIRONMENT_KEY_MAX_LENGTH,
  ENVIRONMENT_KEY_PATTERN,
  ENVIRONMENT_NAME_MAX_LENGTH,
} from "./environments.constants";

const description = z
  .string()
  .trim()
  .max(
    ENVIRONMENT_DESCRIPTION_MAX_LENGTH,
    `must be at most ${ENVIRONMENT_DESCRIPTION_MAX_LENGTH} characters`,
  )
  .nullable()
  .transform((value) => (value === "" ? null : value));

const name = z
  .string()
  .trim()
  .min(1, "is required")
  .max(
    ENVIRONMENT_NAME_MAX_LENGTH,
    `must be at most ${ENVIRONMENT_NAME_MAX_LENGTH} characters`,
  );

export const createEnvironmentSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "is required")
    .max(
      ENVIRONMENT_KEY_MAX_LENGTH,
      `must be at most ${ENVIRONMENT_KEY_MAX_LENGTH} characters`,
    )
    .regex(
      ENVIRONMENT_KEY_PATTERN,
      "must use lowercase letters, numbers and dashes only",
    ),
  name,
  description: description.optional().transform((value) => value ?? null),
});

// strictObject: sending `key` (or anything unknown) is a validation error,
// because the key is immutable after creation.
export const updateEnvironmentSchema = z
  .strictObject({
    name: name.optional(),
    description: description.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "at least one field is required",
  });

export const reorderEnvironmentsSchema = z
  .object({
    ids: z.array(z.number().int().positive()).min(1, "is required"),
  })
  .refine((data) => new Set(data.ids).size === data.ids.length, {
    message: "must not contain duplicates",
    path: ["ids"],
  });

export const environmentIdSchema = z.coerce.number().int().positive();

export const environmentParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listEnvironmentsQuerySchema = z.object({
  includeDeleted: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});
