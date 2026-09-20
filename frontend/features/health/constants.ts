export const HEALTH_STATUS = {
  checking: { label: "Checking API", dotClass: "bg-muted animate-pulse" },
  online: { label: "API online", dotClass: "bg-success" },
  offline: { label: "API offline", dotClass: "bg-danger" },
} as const;
