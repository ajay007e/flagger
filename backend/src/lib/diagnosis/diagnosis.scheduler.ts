import {
  HEALTH_CHECK_TIMEOUT_MS,
  HEALTH_CYCLE_INTERVAL_MS,
} from "./diagnosis.constants";
import { diagnosis } from "./diagnosis.service";
import type { HealthCheck } from "./diagnosis.types";

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

export async function runHealthCycle(): Promise<void> {
  if (running) return; // no overlapping cycles
  running = true;
  try {
    const generation = diagnosis.beginCycle();
    const failures: string[] = [];
    if (checks.length === 0) failures.push("no health checks registered");

    const results = await Promise.allSettled(
      checks.map((c) => withTimeout(c.run(), HEALTH_CHECK_TIMEOUT_MS)),
    );
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        const msg =
          r.reason instanceof Error ? r.reason.message : String(r.reason);
        failures.push(`${checks[i].name}: ${msg}`);
      }
    });

    diagnosis.recordCycleResult(failures, generation);
  } finally {
    running = false;
  }
}

export function startDiagnosisScheduler(
  intervalMs = HEALTH_CYCLE_INTERVAL_MS,
): () => void {
  void runHealthCycle();
  const timer = setInterval(() => void runHealthCycle(), intervalMs);
  return () => clearInterval(timer);
}
