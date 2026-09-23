import type { DEPENDENCY_STATUS, OVERALL_STATUS } from "./health.constants";

export type DependencyStatus =
  (typeof DEPENDENCY_STATUS)[keyof typeof DEPENDENCY_STATUS];
export type OverallStatus =
  (typeof OVERALL_STATUS)[keyof typeof OVERALL_STATUS];

export interface HealthChecks {
  database: DependencyStatus;
  redis: DependencyStatus;
}

export interface HealthData {
  status: OverallStatus;
  uptime: number;
  checks: HealthChecks;
}
