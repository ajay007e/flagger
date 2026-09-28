"use client";

import { ArrowLeft, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";

import { Button } from "@/shared/components";

import { ADMIN_HOME_HREF, FLAGGER_HOME_HREF } from "../admin.constants";
import { AdminNav } from "./admin-nav";

function BackToFlaggerLink({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href={FLAGGER_HOME_HREF}
      onClick={onNavigate}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to Flagger
    </Link>
  );
}

/**
 * Navigation chrome for every /admin/* page: a persistent left sidebar from
 * `md:` up, and below that a slim header with a menu button that opens the
 * same links in an off-canvas panel. Access control is not this component's
 * job — app/admin/layout.tsx already redirects non-admins before rendering it.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col md:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col justify-between gap-6 border-r border-border p-4 md:flex">
        <div className="flex flex-col gap-4">
          <Link href={ADMIN_HOME_HREF} className="px-3 text-sm font-semibold">
            Admin
          </Link>
          <AdminNav />
        </div>

        <BackToFlaggerLink />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2 md:hidden">
          <span className="text-sm font-semibold">Admin</span>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Open admin menu"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen(true)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {children}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <div
            id={panelId}
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col justify-between gap-6 border-r border-border bg-surface p-4 shadow-xl"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="px-3 text-sm font-semibold">Admin</span>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close admin menu"
                  onClick={() => setOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <AdminNav onNavigate={() => setOpen(false)} />
            </div>

            <BackToFlaggerLink onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
