"use client";

import { useCallback } from "react";

import { useApiQuery } from "@/shared/hooks";

import { entitiesService } from "./entities.service";

export function useEntities(
  projectId: number,
  page: number,
  limit: number,
  includeDeleted: boolean,
) {
  const request = useCallback(
    () => entitiesService.list(projectId, page, limit, includeDeleted),
    [projectId, page, limit, includeDeleted],
  );

  return useApiQuery(request);
}
