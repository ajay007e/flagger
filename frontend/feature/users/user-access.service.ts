import type { ApiResponse, PaginatedData } from "@/shared";
import { api } from "@/shared/lib";

import { ENTITY_PICKER_LIMIT } from "./user-access.constants";
import type {
  AccessAssignment,
  AccessInput,
  AccessOption,
  AvailableAccess,
  RoleOption,
  UpdateAccessInput,
} from "./user-access.types";

const BASE = "/api/v1";

export const userAccessService = {
  available() {
    return api.get<ApiResponse<AvailableAccess>>(`${BASE}/access/available`);
  },

  roles() {
    return api.get<ApiResponse<RoleOption[]>>(`${BASE}/access/roles`);
  },

  entities(projectId: number) {
    return api.get<ApiResponse<PaginatedData<AccessOption>>>(
      `${BASE}/projects/${projectId}/entities`,
      { params: { limit: ENTITY_PICKER_LIMIT } },
    );
  },

  list(userId: number) {
    return api.get<ApiResponse<AccessAssignment[]>>(
      `${BASE}/users/${userId}/access`,
    );
  },

  assign(userId: number, input: AccessInput) {
    return api.post<ApiResponse<AccessAssignment>>(
      `${BASE}/users/${userId}/access`,
      input,
    );
  },

  update(userId: number, assignmentId: string, input: UpdateAccessInput) {
    return api.patch<ApiResponse<AccessAssignment>>(
      `${BASE}/users/${userId}/access/${assignmentId}`,
      input,
    );
  },

  revoke(userId: number, assignmentId: string) {
    return api.delete<ApiResponse<null>>(
      `${BASE}/users/${userId}/access/${assignmentId}`,
    );
  },
};
