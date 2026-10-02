import type { ApiResponse } from "@/shared";
import { api } from "@/shared/lib";

import type {
  CreateEnvironmentInput,
  Environment,
  UpdateEnvironmentInput,
} from "./environments.types";

const BASE = "/api/v1/environments";

export const environmentsService = {
  list(includeDeleted: boolean) {
    return api.get<ApiResponse<Environment[]>>(BASE, {
      params: { includeDeleted },
    });
  },

  create(input: CreateEnvironmentInput) {
    return api.post<ApiResponse<Environment>>(BASE, input);
  },

  update(id: number, input: UpdateEnvironmentInput) {
    return api.patch<ApiResponse<Environment>>(`${BASE}/${id}`, input);
  },

  remove(id: number) {
    return api.delete<ApiResponse<null>>(`${BASE}/${id}`);
  },

  restore(id: number) {
    return api.post<ApiResponse<Environment>>(`${BASE}/${id}/restore`);
  },

  /** `ids` must be every active environment, once each, in the new order. */
  reorder(ids: number[]) {
    return api.put<ApiResponse<Environment[]>>(`${BASE}/order`, { ids });
  },
};
