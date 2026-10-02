export const DIAGNOSIS_PUBLIC_MESSAGE = "Service is temporarily unavailable.";
export const HEALTH_CYCLE_INTERVAL_MS = 15_000;
export const HEALTH_CHECK_TIMEOUT_MS = 5_000;
export const RETRY_AFTER_SECONDS = 15;

/** Consecutive fully clean scheduler cycles required before DOWN -> UP. */
export const REQUIRED_CLEAN_CYCLES = 1;

/** Reachable while DOWN. TODO: confirm the real health path. */
export const GUARD_EXEMPT_PATHS: readonly string[] = [
  "/api/v1/diagnosis",
  "/api/v1/health",
];
