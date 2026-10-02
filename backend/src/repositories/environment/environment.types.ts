// Confirm this import path against user.types.ts.
import type { EnvironmentModel } from "@/generated/prisma/models";

export type Environment = EnvironmentModel;

export interface CreateEnvironmentInput {
  key: string;
  name: string;
  description: string | null;
  sortOrder: number;
  updatedBy: number | null;
}

export interface UpdateEnvironmentInput {
  name?: string;
  description?: string | null;
  updatedBy: number;
}
