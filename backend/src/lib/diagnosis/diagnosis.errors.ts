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
  const e = err as { name?: string; code?: string } | null;
  if (!e) return false;
  if (e.name === "PrismaClientInitializationError") return true;
  if (e.code && (PRISMA_CRITICAL.has(e.code) || NODE_CRITICAL.has(e.code)))
    return true;
  return !!e.name && REDIS_CRITICAL.has(e.name);
}

export function describeError(err: unknown): string {
  const e = err as { name?: string; code?: string } | null;
  return [e?.name, e?.code].filter(Boolean).join(" ") || "unknown error";
}
