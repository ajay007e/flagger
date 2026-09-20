import type { HEALTH_STATUS } from "./constants";

export type HealthData = {
  status: string;
  uptime: number;
  timestamp: string;
};

export type HealthState = keyof typeof HEALTH_STATUS;
