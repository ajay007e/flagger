"use client";

import { useEffect } from "react";

import {
  getDiagnosisStatus,
  getDownVersion,
  setDiagnosisDown,
  setDiagnosisUp,
} from "@/shared/lib";

import {
  POLL_INTERVAL_DOWN_MS,
  POLL_INTERVAL_UP_MS,
} from "./diagnosis.constants";
import { diagnosisService } from "./diagnosis.service";

/**
 * Polls the backend diagnosis status. Mount once (DiagnosisGate does).
 * 5s while DOWN, 20s while UP. An unreachable backend or a bad response
 * counts as DOWN. Only a backend answer of UP can restore the app.
 */
export function useDiagnosisPolling(): void {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      const versionAtStart = getDownVersion();

      try {
        const { data: body } = await diagnosisService.get();

        if (!cancelled) {
          if (
            !body.success ||
            !("data" in body) ||
            body.data.status === "DOWN"
          ) {
            setDiagnosisDown();
          } else if (versionAtStart === getDownVersion()) {
            setDiagnosisUp();
          }
        }
      } catch {
        if (!cancelled) setDiagnosisDown();
      }

      if (!cancelled) {
        timer = setTimeout(
          tick,
          getDiagnosisStatus() === "UP"
            ? POLL_INTERVAL_UP_MS
            : POLL_INTERVAL_DOWN_MS,
        );
      }
    }

    void tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);
}
