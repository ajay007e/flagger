export const LOG_SCOPES = [
  "http",
  "auth",
  "session",
  "db",
  "redis",
  "diagnosis",
  "audit",
  "process",
  "health",
  "environments",
  "projects",
  "entities",
  "users",
] as const;
export type LogScope = (typeof LOG_SCOPES)[number];

type Primitive = string | number | boolean;

/** Event-specific values. Primitives and arrays of primitives only, never objects. */
export type LogData = Record<string, Primitive | Primitive[] | undefined>;

/** Context values, not for filtering. Never an email. */
export interface LogMeta {
  userId?: number;
  sessionVersion?: number;
  userType?: "admin" | "user";
  [key: string]: Primitive | undefined;
}

/** Held in AsyncLocalStorage. `requestId` is absent for background jobs. */
export interface LogContext {
  requestId?: string;
  traceId: string;
  meta: LogMeta;
}

export interface LogExtra {
  data?: LogData;
  err?: unknown;
}

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";
