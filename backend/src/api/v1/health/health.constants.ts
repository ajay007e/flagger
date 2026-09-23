/** Each dependency check is given this long before it counts as down. */
export const HEALTH_CHECK_TIMEOUT_MS = 2000;

export const DEPENDENCY_STATUS = {
  UP: "up",
  DOWN: "down",
} as const;

export const OVERALL_STATUS = {
  OK: "ok",
  DEGRADED: "degraded",
} as const;
