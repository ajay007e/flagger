import axios, { type AxiosError } from "axios";

import { env } from "@/shared/config";
import { ERROR_CODES } from "@/shared/constants";
import type { ErrorResponse } from "@/shared/types";

import { setUnauthenticated } from "./auth";
import { API_TIMEOUT_MS } from "./constants";
import { setDiagnosisDown } from "./diagnosis";

export const api = axios.create({
  baseURL: env.apiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    if (!axios.isCancel(error)) {
      const unreachable = !error.response;
      const blocked =
        error.response?.status === 503 ||
        error.response?.data?.code === ERROR_CODES.SERVICE_UNAVAILABLE;

      if (unreachable || blocked) setDiagnosisDown();
    }
    const code = error.response?.data?.code;

    if (code === ERROR_CODES.SESSION_EXPIRED) {
      setUnauthenticated("expired");
    } else if (code === ERROR_CODES.UNAUTHENTICATED) {
      setUnauthenticated();
    }

    return Promise.reject(error);
  },
);
