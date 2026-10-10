import { LOG_SCOPES } from "@/config/env";

export type LogScope = (typeof LOG_SCOPES)[number];

type Primitive = string | number | boolean;

export type LogData = Record<string, Primitive | Primitive[] | undefined>;

export interface LogMeta {
  userId?: number;
  sessionVersion?: number;
  userType?: "admin" | "user";
  [key: string]: Primitive | undefined;
}

export interface RequestCounters {
  queryCount: number;
  dbTimeMs: number;
  services: string[];
}

export interface LogContext {
  requestId?: string;
  traceId: string;
  meta: LogMeta;
  counters: RequestCounters;
}

export interface LogExtra {
  data?: LogData;
  err?: unknown;
}

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";
