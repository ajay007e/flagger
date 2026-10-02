import type { ApiResponse } from "@/shared";
import { api } from "@/shared/lib";

import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "./projects.types";

const BASE = "/api/v1/projects";

export const projectsService = {
  list(includeDeleted: boolean) {
    return api.get<ApiResponse<Project[]>>(BASE, {
      params: { includeDeleted },
    });
  },

  create(input: CreateProjectInput) {
    return api.post<ApiResponse<Project>>(BASE, input);
  },

  update(id: number, input: UpdateProjectInput) {
    return api.patch<ApiResponse<Project>>(`${BASE}/${id}`, input);
  },

  remove(id: number) {
    return api.delete<ApiResponse<null>>(`${BASE}/${id}`);
  },

  restore(id: number) {
    return api.post<ApiResponse<Project>>(`${BASE}/${id}/restore`);
  },
};
