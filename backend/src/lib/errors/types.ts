import type { ERROR_CODES } from "./constants";

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ErrorResponse {
  success: false;
  message: string;
  code: ErrorCode;
  requestId?: string;
}
