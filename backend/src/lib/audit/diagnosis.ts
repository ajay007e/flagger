import { randomUUID } from "node:crypto";

import { diagnosis } from "@/lib/diagnosis";

import { ACTOR_TYPES } from "./constants";
import { drainAuditEvents, recordAuditEvent } from "./fallback";

/** Audits every UP/DOWN transition as a system event, and drains the buffer on recovery. */
export function registerDiagnosisAudit(): void {
  diagnosis.onTransition((t) => {
    void (async () => {
      await recordAuditEvent({
        actorType: ACTOR_TYPES.SYSTEM,
        action: t.to === "DOWN" ? "diagnosis.down" : "diagnosis.up",
        resourceType: "diagnosis",
        before: { status: t.from },
        after: { status: t.to },
        metadata: t.reason ? { reason: t.reason } : undefined,
        occurredAt: t.at,
        request: { requestId: randomUUID(), ipAddress: null, userAgent: null },
      });
      if (t.to === "UP") await drainAuditEvents();
    })();
  });
}
