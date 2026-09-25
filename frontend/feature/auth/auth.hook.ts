"use client";

import { useEffect } from "react";

import { useApiQuery } from "@/shared/hooks";
import { setAuthenticated } from "@/shared/lib/auth";

import { authService } from "./auth.service";

/**
 * Checks the current session once, on mount (useApiQuery fires automatically),
 * and syncs a successful result into the global auth store. A failure that
 * the backend recognizes as an auth problem (UNAUTHENTICATED, SESSION_EXPIRED)
 * is already handled by the axios interceptor (shared/lib/api.ts), which
 * flips the store directly — this hook only needs to react to success.
 */
export function useCurrentUser() {
  const query = useApiQuery(authService.me);

  useEffect(() => {
    if (query.data) {
      setAuthenticated(query.data);
    }
  }, [query.data]);

  return query;
}
