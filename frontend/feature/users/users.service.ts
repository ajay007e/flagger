import type { ApiResponse, PaginatedData } from "@/shared";
import { api } from "@/shared/lib";

import type {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserCredentials,
  UsersQuery,
} from "./users.types";

const BASE = "/api/v1/users";

export const usersService = {
  list(params: UsersQuery) {
    return api.get<ApiResponse<PaginatedData<User>>>(BASE, { params });
  },

  create(input: CreateUserInput) {
    return api.post<ApiResponse<UserCredentials>>(BASE, input);
  },

  update(id: number, input: UpdateUserInput) {
    return api.patch<ApiResponse<User>>(`${BASE}/${id}`, input);
  },

  disable(id: number) {
    return api.post<ApiResponse<User>>(`${BASE}/${id}/disable`);
  },

  enable(id: number) {
    return api.post<ApiResponse<User>>(`${BASE}/${id}/enable`);
  },

  resetPassword(id: number) {
    return api.post<ApiResponse<UserCredentials>>(
      `${BASE}/${id}/reset-password`,
    );
  },

  remove(id: number) {
    return api.delete<ApiResponse<null>>(`${BASE}/${id}`);
  },

  restore(id: number) {
    return api.post<ApiResponse<User>>(`${BASE}/${id}/restore`);
  },
};
