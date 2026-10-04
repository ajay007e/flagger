import { randomUUID } from "node:crypto";

import {
  createLogContext,
  describeFailure,
  getLogger,
  logContext,
} from "@/lib/logger";

import {
  HEALTH_CHECK_TIMEOUT_MS,
  HEALTH_CYCLE_INTERVAL_MS,
} from "./diagnosis.constants";
import { diagnosis } from "./diagnosis.service";
import type { HealthCheck } from "./diagnosis.types";

const log = getLogger("health");
const schedulerLog = getLogger("diagnosis");

const checks: HealthCheck[] = [];
let running = false;

export const registerHealthCheck = (c: HealthCheck): void =>
  void checks.push(c);

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

const elapsedMs = (startedAt: bigint): number =>
  Math.round(Number(process.hrtime.bigint() - startedAt) / 1e6);

async function runCheck(check: HealthCheck): Promise<string | null> {
  const startedAt = process.hrtime.bigint();

  try {
    await withTimeout(check.run(), HEALTH_CHECK_TIMEOUT_MS);

    const durationMs = elapsedMs(startedAt);

    log.debug(
      "health.check.passed",
      `Health check ${check.name} passed in ${durationMs}ms`,
      { data: { check: check.name, outcome: "ok", durationMs } },
    );

    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const durationMs = elapsedMs(startedAt);

    log.warn(
      "health.check.failed",
      `Health check ${check.name} failed after ${durationMs}ms`,
      {
        data: {
          check: check.name,
          outcome: "error",
          durationMs,
          errorType: describeFailure(error).errorType,
          timedOut: message.startsWith("timed out"),
        },
      },
    );

    return `${check.name}: ${message}`;
  }
}

export async function runHealthCycle(): Promise<void> {
  if (running) return;
  running = true;

  try {
    await logContext.run(createLogContext(randomUUID()), async () => {
      const startedAt = process.hrtime.bigint();
      const generation = diagnosis.beginCycle();
      const failures: string[] = [];

      if (checks.length === 0) failures.push("no health checks registered");

      const outcomes = await Promise.all(checks.map(runCheck));

      for (const outcome of outcomes) {
        if (outcome !== null) failures.push(outcome);
      }

      const durationMs = elapsedMs(startedAt);

      log[failures.length > 0 ? "warn" : "debug"](
        "health.cycle.completed",
        failures.length > 0
          ? `Health cycle found ${failures.length} problem(s) in ${durationMs}ms`
          : `Health cycle clean in ${durationMs}ms`,
        {
          data: {
            checkCount: checks.length,
            failureCount: failures.length,
            durationMs,
          },
        },
      );

      diagnosis.recordCycleResult(failures, generation);
    });
  } finally {
    running = false;
  }
}

export function startDiagnosisScheduler(
  intervalMs = HEALTH_CYCLE_INTERVAL_MS,
): () => void {
  schedulerLog.info(
    "diagnosis.scheduler.started",
    `Health scheduler started with a ${intervalMs}ms interval`,
    { data: { intervalMs } },
  );

  void runHealthCycle();
  const timer = setInterval(() => void runHealthCycle(), intervalMs);

  return () => {
    clearInterval(timer);
    schedulerLog.info(
      "diagnosis.scheduler.stopped",
      "Health scheduler stopped",
    );
  };
}
