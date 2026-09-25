"use client";

import { useApiQuery } from "@/shared/hooks";

import { healthService } from "./health.service";

export function useHealth() {
  return useApiQuery(healthService.check);
}
