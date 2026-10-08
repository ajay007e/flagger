import { z } from "zod";

import {
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_TYPES,
} from "./users.constants";

export const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .max(
      USER_EMAIL_MAX_LENGTH,
      `Must be at most ${USER_EMAIL_MAX_LENGTH} characters`,
    )
    .email("Enter a valid email address"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(
      USER_NAME_MAX_LENGTH,
      `Must be at most ${USER_NAME_MAX_LENGTH} characters`,
    ),
  type: z.enum(USER_TYPES),
});
