export type DiagnosisStatus = "UP" | "DOWN";

/** Public shape. Never contains raw error text. */
export interface DiagnosisSnapshot {
  status: DiagnosisStatus;
  message: string | null;
  since: string;
  lastCheckedAt: string | null;
}

export interface DiagnosisTransition {
  from: DiagnosisStatus;
  to: DiagnosisStatus;
  /** Internal detail. For logs and audit only, never for HTTP responses. */
  reason: string | null;
  at: Date;
}

export interface HealthCheck {
  name: string;
  run: () => Promise<void>;
}
