import axios, { type AxiosError } from "axios";

import { env } from "@/shared/config";
import { ERROR_CODES } from "@/shared/constants";
import type { ErrorResponse } from "@/shared/types";

import { setUnauthenticated } from "./auth";
import { API_TIMEOUT_MS } from "./constants";

export const api = axios.create({
  baseURL: env.apiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: API_TIMEOUT_MS,
  // Send the session cookie on every request.
  withCredentials: true,
});

// Wherever in the app a request comes back UNAUTHENTICATED or SESSION_EXPIRED,
// the current session is no longer valid. Flip the global auth state here,
// once, instead of every call site having to handle it — <AuthGate> reacts to
// the change and shows the login modal.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    const code = error.response?.data?.code;

    if (
      code === ERROR_CODES.UNAUTHENTICATED ||
      code === ERROR_CODES.SESSION_EXPIRED
    ) {
      setUnauthenticated();
    }

    return Promise.reject(error);
  },
);
