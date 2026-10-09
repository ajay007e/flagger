import { flushLogs } from "@/lib/logger";

const FLUSH_DELAY_MS = 200;

export function exitAfterFlush(code: number): void {
  flushLogs();
  setTimeout(() => process.exit(code), FLUSH_DELAY_MS);
}
