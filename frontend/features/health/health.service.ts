import type { ApiResponse } from "@/shared";
import { api } from "@/shared/lib";

import type { HealthData } from "./types";

export const healthService = {
  check() {
    return api.get<ApiResponse<HealthData>>("/api/health");
  },
};
