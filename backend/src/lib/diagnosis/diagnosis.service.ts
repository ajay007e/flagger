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

class DiagnosisService {
  // Fail closed: DOWN on boot until the scheduler completes a clean cycle.
  private status: DiagnosisStatus = "DOWN";
  private reason: string | null = "Awaiting first health check";
  private since = new Date();
  private lastCheckedAt: Date | null = null;
  private cleanCycles = 0;
  // Bumped on every markDown. Lets a cycle detect a failure that happened mid-cycle.
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

  /** Internal detail for logs/audit. Never return this over HTTP. */
  internalReason(): string | null {
    return this.reason;
  }

  /** Subscribe to UP/DOWN transitions (used later by audit and drain). */
  onTransition(fn: Listener): void {
    this.listeners.push(fn);
  }

  /** Callable from anywhere (error handler, jobs, scheduler). */
  markDown(reason: string): void {
    this.generation++;
    this.cleanCycles = 0;
    this.reason = reason;
    if (this.status === "DOWN") return;
    this.status = "DOWN";
    this.since = new Date();
    this.emit("UP", "DOWN");
  }

  /** SCHEDULER ONLY. Call at the start of a cycle, pass the result to recordCycleResult. */
  beginCycle(): number {
    return this.generation;
  }

  /**
   * SCHEDULER ONLY. The sole DOWN -> UP path. Never call from request code.
   * Any failure, or a markDown during the cycle, discards the cycle as not clean.
   */
  recordCycleResult(failures: string[], startedGeneration: number): void {
    this.lastCheckedAt = new Date();

    if (failures.length > 0) {
      this.markDown(failures.join("; "));
      return;
    }
    if (startedGeneration !== this.generation) return; // failure raced the cycle
    if (this.status === "UP") return;

    this.cleanCycles++;
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
    console.error(
      `[diagnosis] ${from} -> ${to}${t.reason ? `: ${t.reason}` : ""}`,
    );
    for (const fn of this.listeners) {
      try {
        fn(t);
      } catch (err) {
        console.error("[diagnosis] listener failed", err);
      }
    }
  }
}

export const diagnosis = new DiagnosisService();
