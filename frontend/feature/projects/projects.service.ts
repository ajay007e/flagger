import type { ApiResponse, PaginatedData } from "@/shared";
import { api } from "@/shared/lib";

import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "./projects.types";

const BASE = "/api/v1/projects";

export const projectsService = {
  list(page: number, limit: number, includeDeleted: boolean) {
    return api.get<ApiResponse<PaginatedData<Project>>>(BASE, {
      params: { page, limit, includeDeleted },
    });
  },

  get(id: number) {
    return api.get<ApiResponse<Project>>(`${BASE}/${id}`);
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
