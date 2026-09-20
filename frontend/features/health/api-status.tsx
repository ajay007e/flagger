"use client";

import { cn } from "@/shared/lib/utils";

import { HEALTH_STATUS } from "./constants";
import { useHealth } from "./health.hook";
import type { HealthState } from "./types";

export function ApiStatus() {
  const { loading, error } = useHealth();

  let state: HealthState = "online";

  if (loading) {
    state = "checking";
  } else if (error) {
    state = "offline";
  }

  const { label, dotClass } = HEALTH_STATUS[state];

  return (
    <div
      role="status"
      title={error ?? label}
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
