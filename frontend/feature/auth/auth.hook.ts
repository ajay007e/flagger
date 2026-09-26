"use client";

import { useEffect, useState } from "react";

import { useApiQuery } from "@/shared/hooks";
import { getErrorMessage } from "@/shared/lib";
import { setAuthenticated, setUnauthenticated } from "@/shared/lib/auth";

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

/** Logs the current user out. Always ends in "unauthenticated" (the request
 * is nearly impossible to fail meaningfully — see backend A3 — and even a
 * network error shouldn't leave the UI claiming to still be logged in). */
export function useLogout() {
  const [loading, setLoading] = useState(false);

  async function logout(): Promise<void> {
    setLoading(true);

    try {
      await authService.logout();
    } catch (error) {
      console.error(getErrorMessage(error));
    } finally {
      setUnauthenticated();
      setLoading(false);
    }
  }

  return { logout, loading };
}
