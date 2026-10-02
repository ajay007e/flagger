import type { ProjectModel } from "@/generated/prisma/models";

export type Project = ProjectModel;

export interface CreateProjectInput {
  key: string;
  name: string;
  description: string | null;
  updatedBy: number | null;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  updatedBy: number;
}
