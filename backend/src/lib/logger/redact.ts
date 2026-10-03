import type { LogData } from "./types";

const SENSITIVE_KEYS = [
  "password",
  "newPassword",
  "currentPassword",
  "passwordHash",
  "token",
  "setupKey",
  "sessionId",
  "secret",
  "cookie",
  "authorization",
  "email",
];

// Defense in depth: the typed API already keeps these out. If one slips into
// data, meta or err, it is censored by key name.
export const REDACT_PATHS = SENSITIVE_KEYS.flatMap((k) => [
  k,
  `data.${k}`,
  `meta.${k}`,
  `err.${k}`,
]);

const LIMITS: Record<string, number> = { sql: 2000, userAgent: 200 };
const DEFAULT_LIMIT = 200;
const MAX_ARRAY = 50;

export const cap = (v: unknown, n = DEFAULT_LIMIT): string =>
  String(v ?? "").slice(0, n);

const capValue = (key: string, v: string | number | boolean) =>
  typeof v === "string" ? cap(v, LIMITS[key] ?? DEFAULT_LIMIT) : v;

export function sanitizeData(data?: LogData): LogData | undefined {
  if (!data) return undefined;
  const out: LogData = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    out[k] = Array.isArray(v)
      ? v.slice(0, MAX_ARRAY).map((x) => capValue(k, x))
      : capValue(k, v);
  }
  return out;
}

// Only type, message, code and stack frames are kept. Prisma messages and
// stack headers can embed the query arguments, so for those the message is
// replaced by the code, and stacks are frames only for every error.
export function serializeErr(err: unknown) {
  if (!(err instanceof Error))
    return { type: "NonError", message: cap(err, 300) };
  const code = (err as { code?: unknown }).code;
  const isPrisma = err.name.startsWith("PrismaClient");
  return {
    type: err.name,
    message: isPrisma
      ? `Prisma error${code ? ` ${String(code)}` : ""}`
      : cap(err.message, 500),
    code:
      typeof code === "string" || typeof code === "number" ? code : undefined,
    stack: err.stack
      ?.split("\n")
      .filter((l) => /^\s+at /.test(l))
      .slice(0, 30)
      .join("\n"),
  };
}
