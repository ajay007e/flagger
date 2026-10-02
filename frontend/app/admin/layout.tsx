"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { getDefaultRoute } from "@/feature/auth";
import { PageLoader } from "@/shared/components";
import { useAuth } from "@/shared/lib/auth";

/**
 * Guards every /admin/* route: non-admins are sent back to their own default
 * route rather than shown a not-found page. Navigation chrome (navbar,
 * sidebar) is not this layout's concern — the root AppShell already renders
 * the admin sidebar for admins on /admin/* paths. AuthGate (root layout)
 * covers "no session" / "must change password" — by the time this runs,
 * status is either "authenticated" or still resolving, never the other two.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, user } = useAuth();
  const isAdmin = user?.type === "admin";

  useEffect(() => {
    if (status === "authenticated" && user && !isAdmin) {
      router.replace(getDefaultRoute(user.type));
    }
  }, [status, user, isAdmin, router]);

  if (status !== "authenticated" || !isAdmin) {
    // Either AuthGate is still resolving (its own modal/loader already covers
    // that), or the redirect above is about to fire — don't flash admin
    // content in either case.
    return <PageLoader label="Loading…" />;
  }
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {children}
    </div>
  );
}
