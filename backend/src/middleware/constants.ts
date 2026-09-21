/** Safe messages for errors raised by Express itself (body parsing). Keyed by error type. */
export const CLIENT_ERROR_MESSAGES: Record<string, string> = {
  "entity.parse.failed": "Request body must be valid JSON",
  "entity.too.large": "Request body is too large",
};

export const DEFAULT_CLIENT_ERROR_MESSAGE = "Invalid request";
