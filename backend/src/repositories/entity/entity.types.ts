import type { EntityModel } from "@/generated/prisma/models";

export type Entity = EntityModel;

export interface CreateEntityInput {
  projectId: number;
  key: string;
  name: string;
  description: string | null;
  updatedBy: number | null;
}

export interface UpdateEntityInput {
  name?: string;
  description?: string | null;
  updatedBy: number;
}
