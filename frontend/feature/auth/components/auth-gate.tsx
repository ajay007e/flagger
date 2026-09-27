"use client";

import type { ReactNode } from "react";

import { PageLoader } from "@/shared/components";
import { useAuth } from "@/shared/lib/auth";

import { useCurrentUser } from "../auth.hook";
import { ChangePasswordModal } from "./change-password-modal";
import { LoginModal } from "./login-modal";

/**
 * Wraps the app's content. Checks once, on mount (via useCurrentUser), whether
 * the current session (if any) is still valid, then blocks behind whichever
 * gate applies — the login modal if there's no valid session, or the change-
 * password modal if there is one but the user still has to set a new
 * password — before rendering children. No dedicated pages for either, no
 * redirect: whatever the user was looking at is exactly where they land once
 * the gate clears.
 *
 * A session that goes invalid *after* this check (e.g. it expires while
 * browsing) is caught by the axios interceptor instead, which flips the auth
 * store directly.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  useCurrentUser();
  const { status, user } = useAuth();

  if (status === "checking") {
    return <PageLoader label="Checking your session…" />;
  }

  const mustChangePassword =
    status === "authenticated" && Boolean(user?.mustChangePassword);
  const blocked = status === "unauthenticated" || mustChangePassword;

  return (
    <>
      {/* inert (React 19 / modern browsers): renders normally but is
          unreachable by keyboard, mouse, or screen reader while a gate is
          up, so nothing behind it can be interacted with. */}
      <div inert={blocked ? true : undefined}>{children}</div>

      <LoginModal open={status === "unauthenticated"} />
      <ChangePasswordModal open={mustChangePassword} />
    </>
  );
}
