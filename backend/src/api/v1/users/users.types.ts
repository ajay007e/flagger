import type { z } from "zod";

import type { createUserSchema } from "./users.validator";

export type CreateUserInput = z.infer<typeof createUserSchema>;

export interface UserSnapshot {
  id: number;
  email: string;
  name: string;
  type: string;
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface CreateUserResult extends UserSnapshot {
  temporaryPassword: string;
}
