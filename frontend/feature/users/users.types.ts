import type { z } from "zod";

import type { USER_STATUSES, USER_TYPES } from "./users.constants";
import type { createUserSchema } from "./users.validator";

export type UserType = (typeof USER_TYPES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

export interface User {
  id: number;
  email: string;
  name: string;
  type: UserType;
  isActive: boolean;
  mustChangePassword: boolean;
  deletedAt: string | null;
}

export interface UserCredentials extends User {
  temporaryPassword: string;
}

export interface UsersQuery {
  page: number;
  limit: number;
  search?: string;
  type?: UserType;
  status?: UserStatus;
}

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = Pick<CreateUserInput, "name" | "type">;
