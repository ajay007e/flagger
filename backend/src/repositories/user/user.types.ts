import type { UserModel } from "@/generated/prisma/models";

// This generator names every model's type "<Model>Model" (UserModel,
// ProjectModel, ...); repositories alias it to the plain model name.
export type User = UserModel;

export interface CreateUserInput {
  email: string;
  name: string;
  /** Already-hashed. The repository never hashes; that is the service's job. */
  password: string;
  type: User["type"];
  isActive: boolean;
  mustChangePassword: boolean;
  /** Who created this row. Null for system actions (e.g. first-admin setup). */
  updatedBy: number | null;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  /** Already-hashed, same as CreateUserInput. */
  password?: string;
  type?: User["type"];
  isActive?: boolean;
  mustChangePassword?: boolean;
  sessionVersion?: number;
  /** Who made this change. Null for a system action. */
  updatedBy: number | null;
}

export type UserListItem = Omit<User, "password" | "sessionVersion">;

export type UserStatus = "active" | "disabled" | "deleted";

export interface UserListFilters {
  search?: string;
  type?: User["type"];
  status?: UserStatus;
  skip: number;
  take: number;
}
