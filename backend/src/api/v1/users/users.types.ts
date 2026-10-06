import type { z } from "zod";

import type {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from "./users.validator";

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

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
