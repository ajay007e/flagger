import { REDACTED_VALUE, SENSITIVE_FIELD_NAMES } from "./constants";

const sensitiveNames = new Set(
  SENSITIVE_FIELD_NAMES.map((name) => name.toLowerCase()),
);

function isSensitiveKey(key: string): boolean {
  return sensitiveNames.has(key.toLowerCase());
}

/**
 * Recursively strips sensitive fields (by name, see SENSITIVE_FIELD_NAMES) from a
 * value before it is written to the audit log. Arrays and nested objects are
 * walked; everything else is returned as-is.
 */
export function sanitizeAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeAuditValue);
  }

  if (value instanceof Date || value === null || typeof value !== "object") {
    return value;
  }

  const result: Record<string, unknown> = {};

  for (const [key, fieldValue] of Object.entries(value)) {
    result[key] = isSensitiveKey(key)
      ? REDACTED_VALUE
      : sanitizeAuditValue(fieldValue);
  }

  return result;
}
