import { getLogger } from "@/lib/logger";

import {
  DIAGNOSIS_PUBLIC_MESSAGE,
  REQUIRED_CLEAN_CYCLES,
} from "./diagnosis.constants";
import type {
  DiagnosisSnapshot,
  DiagnosisStatus,
  DiagnosisTransition,
} from "./diagnosis.types";

type Listener = (t: DiagnosisTransition) => void;

const log = getLogger("diagnosis");

class DiagnosisService {
  private status: DiagnosisStatus = "DOWN";
  private reason: string | null = "Awaiting first health check";
  private since = new Date();
  private lastCheckedAt: Date | null = null;
  private cleanCycles = 0;
  private generation = 0;
  private listeners: Listener[] = [];

  snapshot(): DiagnosisSnapshot {
    return {
      status: this.status,
      message: this.status === "DOWN" ? DIAGNOSIS_PUBLIC_MESSAGE : null,
      since: this.since.toISOString(),
      lastCheckedAt: this.lastCheckedAt?.toISOString() ?? null,
    };
  }

  isUp(): boolean {
    return this.status === "UP";
  }

  internalReason(): string | null {
    return this.reason;
  }

  onTransition(fn: Listener): void {
    this.listeners.push(fn);
  }

  markDown(reason: string): void {
    this.generation++;
    this.cleanCycles = 0;
    this.reason = reason;

    if (this.status === "DOWN") {
      log.debug(
        "diagnosis.markDown.repeat",
        "Failure reported while the system is already DOWN",
        { data: { reason } },
      );
      return;
    }

    this.status = "DOWN";
    this.since = new Date();
    this.emit("UP", "DOWN");
  }

  beginCycle(): number {
    return this.generation;
  }

  recordCycleResult(failures: string[], startedGeneration: number): void {
    this.lastCheckedAt = new Date();

    if (failures.length > 0) {
      log.debug(
        "diagnosis.cycle.failed",
        `Health cycle found ${failures.length} failing check(s)`,
        { data: { failureCount: failures.length } },
      );
      this.markDown(failures.join("; "));
      return;
    }

    if (startedGeneration !== this.generation) {
      log.debug(
        "diagnosis.cycle.discarded",
        "Health cycle discarded because a failure happened during it",
        { data: { status: this.status } },
      );
      return;
    }

    if (this.status === "UP") {
      log.debug("diagnosis.cycle.clean", "Health cycle clean while UP", {
        data: { status: this.status },
      });
      return;
    }

    this.cleanCycles++;

    log.debug(
      "diagnosis.cycle.clean",
      `Clean health cycle ${this.cleanCycles} of ${REQUIRED_CLEAN_CYCLES} needed to recover`,
      {
        data: {
          status: this.status,
          cleanCycles: this.cleanCycles,
          required: REQUIRED_CLEAN_CYCLES,
        },
      },
    );

    if (this.cleanCycles < REQUIRED_CLEAN_CYCLES) return;

    this.status = "UP";
    this.reason = null;
    this.since = new Date();
    this.emit("DOWN", "UP");
  }

  private emit(from: DiagnosisStatus, to: DiagnosisStatus): void {
    const t: DiagnosisTransition = {
      from,
      to,
      reason: this.reason,
      at: this.since,
    };

    log[to === "DOWN" ? "warn" : "info"](
      "diagnosis.status.changed",
      `System status changed from ${from} to ${to}${t.reason ? ` because ${t.reason}` : ""}`,
      { data: { from, to, reason: t.reason ?? undefined } },
    );

    for (const fn of this.listeners) {
      try {
        fn(t);
      } catch (err) {
        log.error(
          "diagnosis.listener.failed",
          "A diagnosis transition listener threw",
          { err },
        );
      }
    }
  }
}

export const diagnosis = new DiagnosisService();
