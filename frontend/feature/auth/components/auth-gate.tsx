"use client";

import { useEffect, type ReactNode } from "react";

import { PageLoader } from "@/shared/components";
import { setAuthenticated, useAuth } from "@/shared/lib/auth";

import { authService } from "../auth.service";
import { LoginModal } from "./login-modal";

/**
 * Wraps the app's content. Checks once, on mount, whether the current session
 * (if any) is still valid, then either renders children or blocks behind the
 * login modal until the user logs in — no dedicated /login page or redirect,
 * so whatever the user was looking at is exactly where they land afterward.
 *
 * A session that goes invalid *after* this check (e.g. it expires while
 * browsing) is caught by the axios interceptor (shared/lib/api.ts) instead,
 * which flips the same store directly; this effect only runs once.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  useEffect(() => {
    authService
      .me()
      .then(({ data }) => {
        if (data.success) {
          setAuthenticated(data.data);
        }
      })
      .catch(() => {
        // The interceptor already moved the store to "unauthenticated" for
        // this failure; nothing further to do here.
      });
    // Intentionally empty: this check must run exactly once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "checking") {
    return <PageLoader label="Checking your session…" />;
  }

  return (
    <>
      {/* inert (React 19 / modern browsers): renders normally but is
          unreachable by keyboard, mouse, or screen reader while the gate is
          up, so nothing behind the modal can be interacted with. */}
      <div inert={status === "unauthenticated" ? true : undefined}>
        {children}
      </div>

      <LoginModal open={status === "unauthenticated"} />
    </>
  );
}
