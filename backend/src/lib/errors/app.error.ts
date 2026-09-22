import { DEFAULT_ERROR_MESSAGES, ERROR_STATUS } from "./constants";
import type { ErrorCode } from "./types";

/**
 * An error the client is allowed to see. The message must be safe to show.
 *
 *   throw new AppError(ERROR_CODES.NOT_FOUND, "Project not found");
 *   throw new AppError(ERROR_CODES.UNAUTHENTICATED);
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(
    code: ErrorCode,
    message: string = DEFAULT_ERROR_MESSAGES[code],
    status: number = ERROR_STATUS[code],
  ) {
    super(message);

    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}
