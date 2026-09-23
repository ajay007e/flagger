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
