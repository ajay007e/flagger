import pino, { type LoggerOptions } from "pino";
import { env } from "@/config/env";
import { logContext } from "./context";
import { REDACT_PATHS, cap, sanitizeData, serializeErr } from "./redact";
import type { LogExtra, LogLevel, LogScope } from "./types";

const options: LoggerOptions = {
  level: env.logLevel,
  base: { service: "flagger-backend", env: env.nodeEnv }, // no pid/hostname
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: { level: (label) => ({ level: label }) }, // "info", not 30
  redact: { paths: REDACT_PATHS, censor: "[REDACTED]" },
  serializers: { err: (e) => e }, // already serialized by serializeErr
  mixin: () => {
    const ctx = logContext.getStore();
    if (!ctx) return {};
    return {
      requestId: ctx.requestId,
      traceId: ctx.traceId,
      meta: Object.keys(ctx.meta).length ? ctx.meta : undefined,
    };
  },
};

const root =
  env.nodeEnv === "development"
    ? pino({
        ...options,
        transport: {
          target: "pino-pretty",
          options: { colorize: true, ignore: "service,env" },
        },
      })
    : pino(options, pino.destination({ dest: 1, sync: env.logSync }));

export type ScopedLogger = Record<
  LogLevel,
  (event: string, msg: string, extra?: LogExtra) => void
>;

const LEVELS: LogLevel[] = ["trace", "debug", "info", "warn", "error", "fatal"];

const QUIET_LEVEL = ["error", "fatal", "silent"].includes(env.logLevel)
  ? env.logLevel
  : "warn";

export function getLogger(scope: LogScope): ScopedLogger {
  const filtered = env.logScopes.length > 0 && !env.logScopes.includes(scope);
  const child = root.child(
    { scope },
    filtered ? { level: QUIET_LEVEL } : undefined,
  );
  const make =
    (level: LogLevel) =>
    (event: string, msg: string, extra: LogExtra = {}) => {
      try {
        child[level](
          {
            event,
            data: sanitizeData(extra.data),
            err: extra.err === undefined ? undefined : serializeErr(extra.err),
          },
          cap(msg, 500),
        );
      } catch {
        // Logging must never break a request.
      }
    };
  return Object.fromEntries(LEVELS.map((l) => [l, make(l)])) as ScopedLogger;
}

export const flushLogs = () => root.flush();
export { logContext } from "./context";
export { cap } from "./redact";
export type { LogContext, LogData, LogMeta, LogScope } from "./types";
