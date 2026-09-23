import { z } from "zod";

import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from "./auth.constants";

export const setupAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email("must be a valid email address"),
  name: z.string().trim().min(1, "is required"),
  password: z
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      `must be at least ${PASSWORD_MIN_LENGTH} characters`,
    )
    .refine((value) => Buffer.byteLength(value, "utf8") <= PASSWORD_MAX_BYTES, {
      message: `must be at most ${PASSWORD_MAX_BYTES} bytes`,
    }),
});

// Deliberately looser than setupAdminSchema: a login attempt just needs
// "something was submitted". Creation-time password rules (min length, byte
// limit) don't belong here — a policy change later should never lock out an
// existing user whose password predates it.
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("must be a valid email address"),
  password: z.string().min(1, "is required"),
});
