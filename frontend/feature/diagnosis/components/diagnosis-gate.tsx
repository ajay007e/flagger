"use client";

import type { ReactNode } from "react";

import { useDiagnosisStatus } from "@/shared/lib";

import { useDiagnosisPolling } from "../diagnosis.hook";
import { ServiceUnavailableModal } from "./service-unavailable-modal";

/**
 * The frontend only reflects the backend diagnosis status.
 * DOWN: render only the modal (children unmount, so no action is possible).
 * UNKNOWN: render nothing until the first answer, so no requests fire while DOWN.
 */
export function DiagnosisGate({ children }: { children: ReactNode }) {
  useDiagnosisPolling();
  const status = useDiagnosisStatus();

  if (status === "UNKNOWN") return null;
  if (status === "DOWN") return <ServiceUnavailableModal />;

  return <>{children}</>;
}
