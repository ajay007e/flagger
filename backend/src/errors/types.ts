import type { ERROR_CODES } from "./constants";

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** The body of every error response. */
export interface ErrorResponse {
  success: false;
  message: string;
  code: ErrorCode;
}
