"use client";

import { LayoutDashboard, LogOut, Settings, UserRound } from "lucide-react";
import { useState } from "react";

import { Avatar, Button, ConfirmDialog, Popover } from "@/shared/components";
import { useAuth } from "@/shared/lib/auth";

import { useLogout } from "../auth.hook";

const MENU_ITEM_CLASS =
  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer";

/**
 * The avatar trigger in the navbar, plus its account popover: user info,
 * "View profile" and "Settings" (placeholders — no destination screen exists
 * yet), an admin-only "Switch to Admin area" placeholder (no admin area
 * exists yet either), and Logout, which opens a confirmation before it does
 * anything.
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
        align="end"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Account menu, ${user.name}`}
            onClick={() => setMenuOpen((open) => !open)}
            className="h-9 w-9 rounded-full p-0"
          >
            <Avatar name={user.name} size="sm" />
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
          Profile
        </button>

        <div className="my-1 border-t border-border" />

        {user.type === "admin" ? (
          <button type="button" disabled className={MENU_ITEM_CLASS}>
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Switch to Admin View
          </button>
        ) : null}

        <button type="button" disabled className={MENU_ITEM_CLASS}>
          <Settings className="h-4 w-4" aria-hidden="true" />
          Settings
        </button>

        <div className="my-1 border-t border-border" />

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className={`${MENU_ITEM_CLASS} hover:bg-danger/10 text-danger`}
        >
          <LogOut className="h-4 w-4 text-danger" aria-hidden="true" />
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
