/**
 * Every machine-readable error code the API can return.
 * Later stories add their own here (for example FORBIDDEN, LAST_ADMIN).
 * Keep in sync with frontend/shared/constants.ts.
 */
export const ERROR_CODES = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  PASSWORD_CHANGE_REQUIRED: "PASSWORD_CHANGE_REQUIRED",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

/** Default HTTP status for each code. */
export const ERROR_STATUS = {
  UNAUTHENTICATED: 401,
  SESSION_EXPIRED: 401,
  PASSWORD_CHANGE_REQUIRED: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const satisfies Record<keyof typeof ERROR_CODES, number>;

/** Safe default message for each code. */
export const DEFAULT_ERROR_MESSAGES = {
  UNAUTHENTICATED: "Authentication required",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  PASSWORD_CHANGE_REQUIRED: "You must change your password before continuing",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Invalid request",
  CONFLICT: "Already exists",
  INTERNAL_ERROR: "Something went wrong",
} as const satisfies Record<keyof typeof ERROR_CODES, string>;
