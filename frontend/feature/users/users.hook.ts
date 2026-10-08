"use client";

import { useCallback } from "react";

import { useApiQuery } from "@/shared/hooks";

import { usersService } from "./users.service";
import type { UsersQuery } from "./users.types";

export function useUsers({ page, limit, search, type, status }: UsersQuery) {
  const request = useCallback(
    () =>
      usersService.list({
        page,
        limit,
        search: search || undefined,
        type,
        status,
      }),
    [page, limit, search, type, status],
  );

  return useApiQuery(request);
}
