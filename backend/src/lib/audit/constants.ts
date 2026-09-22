export const ACTOR_TYPES = {
  USER: "user",
  API_KEY: "api_key",
  SYSTEM: "system",
} as const;

export const OUTCOMES = {
  SUCCESS: "success",
  FAILURE: "failure",
} as const;

/**
 * Field names stripped (recursively, case-insensitive) from `before`, `after`,
 * and `metadata` before a row is written. Match on the field name alone, not
 * its value, so this catches secrets regardless of casing or nesting.
 */
export const SENSITIVE_FIELD_NAMES: readonly string[] = [
  "password",
  "passwordHash",
  "hash",
  "token",
  "secret",
  "apiKey",
  "setupApiKey",
  "sessionSecret",
];

export const REDACTED_VALUE = "[redacted]";

/** Name of the request header carrying a client-supplied request id, if any. */
export const REQUEST_ID_HEADER = "x-request-id";
