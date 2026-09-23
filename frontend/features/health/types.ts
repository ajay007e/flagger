import type { HEALTH_STATUS } from "./constants";

export type DependencyStatus = "up" | "down";

export interface HealthChecks {
  database: DependencyStatus;
  redis: DependencyStatus;
}

export type HealthStatus = "ok" | "degraded";

export type HealthData = {
  status: HealthStatus;
  uptime: number;
  checks: HealthChecks;
};

/** Pill state shown in the navbar. "checking"/"offline" are client-side states
 * (loading, unreachable); "ok"/"degraded" mirror HealthData.status. */
export type HealthState = keyof typeof HEALTH_STATUS;
