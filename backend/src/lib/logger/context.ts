import { AsyncLocalStorage } from "node:async_hooks";

import type { LogContext, LogMeta } from "./types";

export const logContext = new AsyncLocalStorage<LogContext>();

export function createLogContext(
  traceId: string,
  requestId?: string,
): LogContext {
  return {
    requestId,
    traceId,
    meta: {},
    counters: { queryCount: 0, dbTimeMs: 0, services: [] },
  };
}

export function setLogMeta(meta: LogMeta): void {
  const store = logContext.getStore();

  if (store) {
    Object.assign(store.meta, meta);
  }
}
