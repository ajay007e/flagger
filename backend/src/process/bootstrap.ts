import { registerDefaultHealthChecks, registerDiagnosisAudit } from "@/lib";

import { registerCrashHandlers } from "./crash-handlers";
import { registerRedisHealthListeners } from "./dependencies";

export function registerProcess(): void {
  registerDefaultHealthChecks();
  registerDiagnosisAudit();
  registerRedisHealthListeners();
  registerCrashHandlers();
}
