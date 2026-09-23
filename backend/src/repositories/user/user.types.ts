import type { UserModel } from "@/generated/prisma/models";

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
