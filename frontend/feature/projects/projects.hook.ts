"use client";

import { useCallback } from "react";

import { useApiQuery } from "@/shared/hooks";

import { projectsService } from "./projects.service";

export function useProjects(
  page: number,
  limit: number,
  includeDeleted: boolean,
) {
  const request = useCallback(
    () => projectsService.list(page, limit, includeDeleted),
    [page, limit, includeDeleted],
  );

  return useApiQuery(request);
}

export function useProject(id: number) {
  const request = useCallback(() => projectsService.get(id), [id]);
  const query = useApiQuery(request);

  return { ...query, project: query.data ?? null };
}
