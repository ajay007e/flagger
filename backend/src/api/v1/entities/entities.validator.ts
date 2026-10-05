import { z } from "zod";

import {
  ENTITY_DESCRIPTION_MAX_LENGTH,
  ENTITY_KEY_MAX_LENGTH,
  ENTITY_KEY_PATTERN,
  ENTITY_NAME_MAX_LENGTH,
} from "./entities.constants";

import { paginationQuerySchema } from "@/lib/pagination";

const description = z
  .string()
  .trim()
  .max(
    ENTITY_DESCRIPTION_MAX_LENGTH,
    `must be at most ${ENTITY_DESCRIPTION_MAX_LENGTH} characters`,
  )
  .nullable()
  .transform((value) => (value === "" ? null : value));

const name = z
  .string()
  .trim()
  .min(1, "is required")
  .max(
    ENTITY_NAME_MAX_LENGTH,
    `must be at most ${ENTITY_NAME_MAX_LENGTH} characters`,
  );

export const createEntitySchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "is required")
    .max(
      ENTITY_KEY_MAX_LENGTH,
      `must be at most ${ENTITY_KEY_MAX_LENGTH} characters`,
    )
    .regex(
      ENTITY_KEY_PATTERN,
      "must use lowercase letters, numbers and dashes only",
    ),
  name,
  description: description.optional().transform((value) => value ?? null),
});

// strictObject: sending `key`, `projectId` or anything unknown is a validation
// error, because both are immutable after creation.
export const updateEntitySchema = z
  .strictObject({
    name: name.optional(),
    description: description.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "at least one field is required",
  });

export const projectParamsSchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

export const entityParamsSchema = z.object({
  projectId: z.coerce.number().int().positive(),
  id: z.coerce.number().int().positive(),
});

export const listEntitiesQuerySchema = paginationQuerySchema.extend({
  includeDeleted: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});
