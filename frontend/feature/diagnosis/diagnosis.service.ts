import { api } from "@/shared/lib";
import type { ApiResponse } from "@/shared/types";

import { POLL_TIMEOUT_MS } from "./diagnosis.constants";
import type { DiagnosisSnapshot } from "./diagnosis.types";

export const diagnosisService = {
  // TODO: confirm the path against the baseURL (see health.service.ts).
  get: () =>
    api.get<ApiResponse<DiagnosisSnapshot>>("/api/v1/diagnosis", {
      timeout: POLL_TIMEOUT_MS,
    }),
};
