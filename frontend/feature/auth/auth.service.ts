import type { ApiResponse } from "@/shared";
import { api } from "@/shared/lib";
import type { SessionUser } from "@/shared/lib/auth";

import type { ChangePasswordInput, LoginInput } from "./auth.types";

export const authService = {
  login(input: LoginInput) {
    return api.post<ApiResponse<SessionUser>>("/api/v1/auth/login", input);
  },

  me() {
    return api.get<ApiResponse<SessionUser>>("/api/v1/auth/me");
  },

  logout() {
    return api.post<ApiResponse<null>>("/api/v1/auth/logout");
  },

  changePassword(input: ChangePasswordInput) {
    return api.post<ApiResponse<null>>("/api/v1/auth/change-password", input);
  },
};
