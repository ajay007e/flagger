import { useSyncExternalStore } from "react";

/** UNKNOWN until the first answer from the backend. The frontend never decides this itself. */
export type DiagnosisStatus = "UNKNOWN" | "UP" | "DOWN";

let status: DiagnosisStatus = "UNKNOWN";
// Bumped on every DOWN signal. A poll that started before a newer DOWN
// signal must not flip the UI back to UP with a stale answer.
let downVersion = 0;
const listeners = new Set<() => void>();

function set(next: DiagnosisStatus): void {
  if (next === status) return;
  status = next;
  listeners.forEach((listener) => listener());
}

export const getDiagnosisStatus = (): DiagnosisStatus => status;
export const getDownVersion = (): number => downVersion;

export function setDiagnosisDown(): void {
  downVersion++;
  set("DOWN");
}

export function setDiagnosisUp(): void {
  set("UP");
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDiagnosisStatus(): DiagnosisStatus {
  // Server snapshot is UNKNOWN so SSR and hydration match.
  return useSyncExternalStore(subscribe, getDiagnosisStatus, () => "UNKNOWN");
}
