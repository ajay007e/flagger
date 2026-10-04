import { logContext } from "./context";
import { getLogger } from "./logger";
import type { LogData, LogScope } from "./types";

export interface FailureInfo {
  errorType: string;
  code?: string | number;
  status?: number;
}

export function describeFailure(error: unknown): FailureInfo {
  if (!(error instanceof Error)) {
    return { errorType: "NonError" };
  }

  const { code, status } = error as { code?: unknown; status?: unknown };

  return {
    errorType: error.name,
    code:
      typeof code === "string" || typeof code === "number" ? code : undefined,
    status: typeof status === "number" ? status : undefined,
  };
}

export function failureLevel(failure: FailureInfo): "warn" | "error" {
  return failure.status !== undefined && failure.status < 500
    ? "warn"
    : "error";
}

const elapsedMs = (startedAt: bigint): number =>
  Math.round(Number(process.hrtime.bigint() - startedAt) / 1e6);

function safeArgs(args: unknown[]): LogData {
  const data: LogData = {};

  args.forEach((arg, index) => {
    if (typeof arg === "number" || typeof arg === "boolean") {
      data[`arg${index}`] = arg;
    }
  });

  return data;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

export function instrument<T extends object>(scope: LogScope, module: T): T {
  const log = getLogger(scope);
  const wrapped: Record<string, unknown> = {};

  for (const [name, member] of Object.entries(module)) {
    if (typeof member !== "function") {
      wrapped[name] = member;
      continue;
    }

    const operation = `${scope}.${name}`;

    wrapped[name] = (...args: unknown[]): unknown => {
      const startedAt = process.hrtime.bigint();

      logContext.getStore()?.counters.services.push(operation);
      log.info("service.start", `Service ${operation} started`, {
        data: { layer: "service", operation, ...safeArgs(args) },
      });

      const succeed = (): void => {
        const durationMs = elapsedMs(startedAt);

        log.info(
          "service.end",
          `Service ${operation} finished successfully in ${durationMs}ms`,
          { data: { layer: "service", operation, outcome: "ok", durationMs } },
        );
      };

      const fail = (error: unknown): void => {
        const failure = describeFailure(error);
        const durationMs = elapsedMs(startedAt);

        log[failureLevel(failure)](
          "service.end",
          `Service ${operation} failed after ${durationMs}ms`,
          {
            data: {
              layer: "service",
              operation,
              outcome: "error",
              durationMs,
              errorType: failure.errorType,
              code: failure.code,
              status: failure.status,
            },
          },
        );
      };

      let result: unknown;

      try {
        result = (member as (...a: unknown[]) => unknown)(...args);
      } catch (error) {
        fail(error);
        throw error;
      }

      if (isPromiseLike(result)) {
        return Promise.resolve(result).then(
          (value) => {
            succeed();
            return value;
          },
          (error: unknown) => {
            fail(error);
            throw error;
          },
        );
      }

      succeed();
      return result;
    };
  }

  return wrapped as T;
}
