"use client";

import { cn } from "@/shared/lib/utils";

import { HEALTH_STATUS } from "../constants";
import { useHealth } from "../health.hook";
import type { HealthState } from "../types";

export function ApiStatus() {
  const { data, loading, error } = useHealth();

  let state: HealthState = "ok";
  let detail: string | undefined;

  if (loading) {
    state = "checking";
  } else if (error) {
    state = "offline";
    detail = error;
  } else if (data?.status === "degraded") {
    state = "degraded";

    const down = Object.entries(data.checks)
      .filter(([, status]) => status === "down")
      .map(([name]) => name);

    detail = down.length > 0 ? `Down: ${down.join(", ")}` : undefined;
  }

  const { label, dotClass } = HEALTH_STATUS[state];

  return (
    <div
      role="status"
      title={detail ?? label}
      className="flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1.5 text-sm sm:px-3"
    >
      <span
        aria-hidden="true"
        className={cn("h-2.5 w-2.5 rounded-full", dotClass)}
      />
      <span className="sr-only sm:not-sr-only">{label}</span>
    </div>
  );
}
