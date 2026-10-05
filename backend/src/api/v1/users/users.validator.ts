import { z } from "zod";

import {
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_SEARCH_MAX_LENGTH,
  USER_STATUSES,
  USER_TYPES,
} from "./users.constants";
import { paginationQuerySchema } from "@/lib/pagination";

export const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(
      USER_EMAIL_MAX_LENGTH,
      `must be at most ${USER_EMAIL_MAX_LENGTH} characters`,
    )
    .email("must be a valid email address"),
  name: z
    .string()
    .trim()
    .min(1, "is required")
    .max(
      USER_NAME_MAX_LENGTH,
      `must be at most ${USER_NAME_MAX_LENGTH} characters`,
    ),
  type: z.enum(USER_TYPES),
});

export const listUsersQuerySchema = paginationQuerySchema.extend({
  search: z
    .string()
    .trim()
    .max(
      USER_SEARCH_MAX_LENGTH,
      `must be at most ${USER_SEARCH_MAX_LENGTH} characters`,
    )
    .optional()
    .transform((value) => value || undefined),
  type: z.enum(USER_TYPES).optional(),
  status: z.enum(USER_STATUSES).optional(),
});
