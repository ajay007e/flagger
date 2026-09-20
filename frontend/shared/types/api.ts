export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface MessageResponse {
  success: true;
  message: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
}

export type ApiResponse<T> =
  SuccessResponse<T> | MessageResponse | ErrorResponse;
