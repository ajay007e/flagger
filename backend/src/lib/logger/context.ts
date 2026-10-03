import { AsyncLocalStorage } from "node:async_hooks";
import type { LogContext } from "./types";

// The store is mutable on purpose: requireAuth sets `meta.userId` after the
// session resolves, and every later line in the request picks it up.
export const logContext = new AsyncLocalStorage<LogContext>();
