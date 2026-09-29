"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";

import { AccountMenu, AuthGate } from "@/feature/auth";
import { Button, Sidebar } from "@/shared/components";
import { useAuth } from "@/shared/lib/auth";

import { getShellConfig } from "./shell.config";

/**
 * The one frame around every page: a persistent sidebar (title, nav, area
 * switch, account menu) and a scrollable main area — no navbar, no footer.
 * Below `md:` the sidebar becomes a drawer, opened from a minimal top bar
 * (title + hamburger only; nothing else lives there — theme and connectivity
 * moved to /settings, reachable from the account menu).
 *
 * Lives in app/, not in a feature: it composes several (auth, health via
 * AccountMenu/settings, admin), and features don't import each other.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status, user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();

  const config =
    status === "authenticated" && user
      ? getShellConfig(pathname, user.type)
      : null;

  useEffect(() => {
    if (!config) {
      setDrawerOpen(false);
    }
  }, [config]);

  useEffect(() => {
    if (!drawerOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  function sidebarContent(onNavigate?: () => void) {
    if (!config) {
      return null;
    }

    return (
      <div className="flex h-full flex-col gap-4">
        <Link
          href={config.titleHref}
          onClick={onNavigate}
          className="truncate px-2 text-lg font-semibold tracking-tight"
        >
          {config.title}
        </Link>

        <Sidebar
          items={config.items}
          footerItem={config.footerItem}
          onNavigate={onNavigate}
          className="min-h-0 flex-1"
        />

        <div className="border-t border-border pt-2">
          <AccountMenu />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh">
      {config ? (
        <aside className="hidden w-64 shrink-0 border-r border-border p-4 md:flex">
          {sidebarContent()}
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {config ? (
          <div className="flex items-center gap-2 border-b border-border p-4 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls={drawerId}
              onClick={() => setDrawerOpen(true)}
              className="h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <span className="truncate text-base font-semibold">
              {config.title}
            </span>
          </div>
        ) : null}

        <main className="min-h-0 flex-1 overflow-y-auto">
          <AuthGate>{children}</AuthGate>
        </main>
      </div>

      {drawerOpen && config ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <div
            id={drawerId}
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-4 border-r border-border bg-surface p-4 shadow-xl"
          >
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {sidebarContent(() => setDrawerOpen(false))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
