"use client";

import { useCallback } from "react";

import { useApiQuery } from "@/shared/hooks";

import { projectsService } from "./projects.service";

export function useProjects(includeDeleted: boolean) {
  const request = useCallback(
    () => projectsService.list(includeDeleted),
    [includeDeleted],
  );

  return useApiQuery(request);
}

/** There is no GET /projects/:id, so find it in the full list (deleted included). */
export function useProject(id: number) {
  const query = useProjects(true);

  return {
    ...query,
    project: query.data?.find((project) => project.id === id) ?? null,
  };
}
