import type { z } from "zod";

import type { changePasswordSchema, loginSchema } from "./auth.validator";

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
