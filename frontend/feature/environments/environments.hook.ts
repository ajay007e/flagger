"use client";

import { useCallback } from "react";

import { useApiQuery } from "@/shared/hooks";

import { environmentsService } from "./environments.service";

export function useEnvironments(includeDeleted: boolean) {
  // Stable per flag value, so useApiQuery refetches only when the flag changes.
  const request = useCallback(
    () => environmentsService.list(includeDeleted),
    [includeDeleted],
  );

  return useApiQuery(request);
}
