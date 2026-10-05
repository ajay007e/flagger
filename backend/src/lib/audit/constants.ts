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
  "temporaryPassword",
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

export const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,36}$/;

export const AUDIT_PENDING_KEY = "flagger:audit:pending";
export const AUDIT_PROCESSING_KEY = "flagger:audit:processing";
export const AUDIT_DEAD_KEY = "flagger:audit:dead";
export const AUDIT_SPOOL_MAX_BYTES = 5 * 1024 * 1024;
export const AUDIT_DB_WRITE_TIMEOUT_MS = 3000;
export const AUDIT_DRAIN_INTERVAL_MS = 30_000;
export const AUDIT_DRAIN_BATCH = 500;
