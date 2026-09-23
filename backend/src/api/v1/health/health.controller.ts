import type { Request, Response } from "express";

import { DEPENDENCY_STATUS, OVERALL_STATUS } from "./health.constants";
import type { HealthData } from "./health.types";
import { checkDatabase, checkRedis } from "./health.utils";

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const [databaseStatus, redisStatus] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);

  const allUp =
    databaseStatus === DEPENDENCY_STATUS.UP &&
    redisStatus === DEPENDENCY_STATUS.UP;

  const data: HealthData = {
    status: allUp ? OVERALL_STATUS.OK : OVERALL_STATUS.DEGRADED,
    uptime: process.uptime(),
    checks: { database: databaseStatus, redis: redisStatus },
  };

  // Always 200: status is reported in the body. A caller that needs an
  // HTTP-level signal (a load balancer, uptime monitor) should read `data.status`.
  res.json({ success: true, data });
}
