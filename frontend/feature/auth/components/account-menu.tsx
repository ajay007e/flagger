"use client";

import { Flag, LogOut, Settings, Shield, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Avatar, Button, ConfirmDialog, Popover } from "@/shared/components";
import { useAuth } from "@/shared/lib/auth";

import { useLogout } from "../auth.hook";
import { ProfileModal } from "./profile-modal";
import { SettingsModal } from "./settings-modal";

const MENU_ITEM_CLASS =
  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer";

// Duplicated from feature/admin's ADMIN_HOME_HREF on purpose: features don't
// import each other, and this is one literal, not worth a shared module for.
const ADMIN_HOME_HREF = "/admin";

function isOnAdminArea(pathname: string): boolean {
  return (
    pathname === ADMIN_HOME_HREF || pathname.startsWith(`${ADMIN_HOME_HREF}/`)
  );
}

/**
 * The avatar-and-name trigger at the bottom of the sidebar, plus its account
 * popover: user info, "View profile" (opens ProfileModal), Settings (opens
 * SettingsModal), the admin/Flagger area switch (admins only — this is the
 * one place it lives, not the sidebar), and Logout, which opens a
 * confirmation before it does anything. side="top" +
 * mobileSidebar=false: the trigger already lives inside the sidebar/drawer,
 * so this opens upward as a small anchored panel at every screen size, not a
 * second stacked mobile sidebar.
 */
export function AccountMenu() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { logout, loading } = useLogout();

  if (!user) {
    return null;
  }

  const onAdminArea = isOnAdminArea(pathname);

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
            <span className="min-w-0 truncate text-sm font-medium">
              {user.name}
            </span>
          </Button>
        }
      >
        <div className="flex flex-col items-center gap-2 px-3 py-4">
          <Avatar name={user.name} size="lg" />
          <span className="text-sm font-medium text-foreground">
            {user.name}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setProfileOpen(true);
            setMenuOpen(false);
          }}
          className={MENU_ITEM_CLASS}
        >
          <UserRound className="h-4 w-4" aria-hidden="true" />
          View profile
        </button>

        <div className="my-1 border-t border-border" />

        <button
          type="button"
          onClick={() => {
            setSettingsOpen(true);
            setMenuOpen(false);
          }}
          className={MENU_ITEM_CLASS}
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          Settings
        </button>

        {user.type === "admin" ? (
          <Link
            href={onAdminArea ? "/" : ADMIN_HOME_HREF}
            onClick={() => setMenuOpen(false)}
            className={MENU_ITEM_CLASS}
          >
            {onAdminArea ? (
              <Flag className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Shield className="h-4 w-4" aria-hidden="true" />
            )}
            {onAdminArea ? "Back to Flagger" : "Go to Admin"}
          </Link>
        ) : null}

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className={`${MENU_ITEM_CLASS} text-danger hover:bg-danger/10`}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </button>
      </Popover>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

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
