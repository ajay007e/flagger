import { isAxiosError } from "axios";

import type { ErrorCode, ErrorResponse } from "../types";
import { DEFAULT_ERROR_MESSAGE, NETWORK_ERROR_MESSAGE } from "./constants";

/**
 * Pulls a readable message out of a failed request. Prefers the `message`
 * sent by the backend (ErrorResponse), then falls back to a generic one.
 */
export function getErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_ERROR_MESSAGE,
): string {
  if (isAxiosError<Partial<ErrorResponse>>(error)) {
    if (!error.response) {
      return NETWORK_ERROR_MESSAGE;
    }

    return error.response.data?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

/** The machine-readable `code` from the backend's ErrorResponse, if there is one. */
export function getErrorCode(error: unknown): ErrorCode | undefined {
  if (isAxiosError<Partial<ErrorResponse>>(error)) {
    return error.response?.data?.code;
  }

  return undefined;
}
