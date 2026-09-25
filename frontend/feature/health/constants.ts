export const HEALTH_STATUS = {
  checking: { label: "Checking API", dotClass: "bg-muted animate-pulse" },
  ok: { label: "API online", dotClass: "bg-success" },
  degraded: { label: "API degraded", dotClass: "bg-warning" },
  offline: { label: "API offline", dotClass: "bg-danger" },
} as const;
