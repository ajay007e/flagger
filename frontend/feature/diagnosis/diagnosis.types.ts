export interface DiagnosisSnapshot {
  status: "UP" | "DOWN";
  message: string | null;
  since: string;
  lastCheckedAt: string | null;
}
