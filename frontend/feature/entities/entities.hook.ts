"use client";

import { useCallback } from "react";

import { useApiQuery } from "@/shared/hooks";

import { entitiesService } from "./entities.service";

export function useEntities(projectId: number, includeDeleted: boolean) {
  const request = useCallback(
    () => entitiesService.list(projectId, includeDeleted),
    [projectId, includeDeleted],
  );

  return useApiQuery(request);
}
