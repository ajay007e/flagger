import type { ERROR_CODES } from "../constants";

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  code: ErrorCode;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
