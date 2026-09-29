"use client";

import { LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Avatar, Button, ConfirmDialog, Popover } from "@/shared/components";
import { useAuth } from "@/shared/lib/auth";

import { useLogout } from "../auth.hook";

const MENU_ITEM_CLASS =
  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent";

/**
 * The avatar-and-name trigger at the bottom of the sidebar, plus its account
 * popover: user info, "View profile" (placeholder — no destination screen
 * exists yet), Settings (theme and API status live there), and Logout, which
 * opens a confirmation before it does anything. side="top" + mobileSidebar=
 * false: the trigger already lives inside the sidebar/drawer, so this opens
 * upward as a small anchored panel at every screen size, not a second
 * stacked mobile sidebar.
 */
export function AccountMenu() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { logout, loading } = useLogout();

  if (!user) {
    return null;
  }

  async function handleConfirmLogout() {
    await logout();
    setConfirmOpen(false);
    setMenuOpen(false);
  }

  return (
    <>
      <Popover
        align="start"
        side="top"
        mobileSidebar={false}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        trigger={
          <Button
            variant="ghost"
            aria-label={`Account menu, ${user.name}`}
            onClick={() => setMenuOpen((open) => !open)}
            className="w-full justify-start gap-2 px-2"
          >
            <Avatar name={user.name} size="sm" />
            <span className="truncate text-sm font-medium">{user.name}</span>
          </Button>
        }
      >
        <div className="flex flex-col items-center gap-2 px-3 py-4">
          <Avatar name={user.name} size="lg" />
          <span className="text-sm font-medium text-foreground">
            {user.name}
          </span>
        </div>

        <button type="button" disabled className={MENU_ITEM_CLASS}>
          <UserRound className="h-4 w-4" aria-hidden="true" />
          View profile
        </button>

        <div className="my-1 border-t border-border" />

        <Link
          href="/settings"
          onClick={() => setMenuOpen(false)}
          className={MENU_ITEM_CLASS}
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          Settings
        </Link>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className={`${MENU_ITEM_CLASS} text-danger hover:bg-danger/10`}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </button>
      </Popover>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        icon={<LogOut className="h-5 w-5" aria-hidden="true" />}
        title="Log out of Flagger?"
        description="You'll need to log back in to continue."
        confirmLabel="Log out"
        loading={loading}
      />
    </>
  );
}
