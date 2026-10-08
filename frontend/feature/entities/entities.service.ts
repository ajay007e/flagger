import type { ApiResponse, PaginatedData } from "@/shared";
import { api } from "@/shared/lib";

import type {
  CreateEntityInput,
  Entity,
  UpdateEntityInput,
} from "./entities.types";

const base = (projectId: number) => `/api/v1/projects/${projectId}/entities`;

export const entitiesService = {
  list(
    projectId: number,
    page: number,
    limit: number,
    includeDeleted: boolean,
  ) {
    return api.get<ApiResponse<PaginatedData<Entity>>>(base(projectId), {
      params: { page, limit, includeDeleted },
    });
  },

  create(projectId: number, input: CreateEntityInput) {
    return api.post<ApiResponse<Entity>>(base(projectId), input);
  },

  update(projectId: number, id: number, input: UpdateEntityInput) {
    return api.patch<ApiResponse<Entity>>(`${base(projectId)}/${id}`, input);
  },

  remove(projectId: number, id: number) {
    return api.delete<ApiResponse<null>>(`${base(projectId)}/${id}`);
  },

  restore(projectId: number, id: number) {
    return api.post<ApiResponse<Entity>>(`${base(projectId)}/${id}/restore`);
  },
};
