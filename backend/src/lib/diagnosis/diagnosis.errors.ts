const PRISMA_CRITICAL = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1003",
  "P1008",
  "P1017",
  "P2024",
]);
const NODE_CRITICAL = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "EPIPE",
  "ENOTFOUND",
]);
const REDIS_CRITICAL = new Set([
  "ClientClosedError",
  "ClientOfflineError",
  "ConnectionTimeoutError",
  "SocketClosedUnexpectedlyError",
]);

export function isCriticalError(err: unknown): boolean {
  const e = err as {
    name?: string;
    code?: string;
    message?: string;
    constructor?: { name?: string };
    meta?: { code?: string | number };
  } | null;
  if (!e) return false;
  if (e.name === "PrismaClientInitializationError") return true;
  if (e.code && (PRISMA_CRITICAL.has(e.code) || NODE_CRITICAL.has(e.code)))
    return true;
  if (
    REDIS_CRITICAL.has(e.name ?? "") ||
    REDIS_CRITICAL.has(e.constructor?.name ?? "")
  )
    return true;
  // Adapter pool exhaustion: Prisma wraps it as P2010 with the driver code in meta.
  return (
    String(e.meta?.code) === "45028" || /pool timeout/i.test(e.message ?? "")
  );
}

export function describeError(err: unknown): string {
  const e = err as {
    name?: string;
    code?: string;
    constructor?: { name?: string };
  } | null;
  const label = e?.name && e.name !== "Error" ? e.name : e?.constructor?.name;
  return [label, e?.code].filter(Boolean).join(" ") || "unknown error";
}
