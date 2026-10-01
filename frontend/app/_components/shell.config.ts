import { LayoutDashboard } from "lucide-react";

import {
  ADMIN_HOME_HREF,
  ADMIN_NAV_ITEMS,
  FLAGGER_HOME_HREF,
} from "@/feature/admin";
import type { SidebarItem } from "@/shared/components";
import { APP_NAME } from "@/shared/config";

/** The Flagger area's sidebar. Flag screens add their links here as they are built. */
const FLAGGER_NAV_ITEMS: readonly SidebarItem[] = [
  {
    label: "Dashboard",
    href: FLAGGER_HOME_HREF,
    icon: LayoutDashboard,
    exact: true,
  },
];

export interface ShellConfig {
  title: string;
  titleHref: string;
  items: readonly SidebarItem[];
}

function isAdminPath(pathname: string): boolean {
  return (
    pathname === ADMIN_HOME_HREF || pathname.startsWith(`${ADMIN_HOME_HREF}/`)
  );
}

/**
 * What the sidebar's title and links show, from where the user is and who
 * they are. A non-admin on an /admin path gets the Flagger config, not the
 * admin one: app/admin/layout.tsx is about to redirect them, and they should
 * never see admin links in the meantime.
 *
 * Switching between the Flagger and admin areas lives in the account menu
 * (feature/auth/components/account-menu.tsx), not here.
 */
export function getShellConfig(
  pathname: string,
  userType: string,
): ShellConfig {
  if (userType === "admin" && isAdminPath(pathname)) {
    return {
      title: `${APP_NAME} Admin`,
      titleHref: ADMIN_HOME_HREF,
      items: ADMIN_NAV_ITEMS,
    };
  }

  return {
    title: APP_NAME,
    titleHref: FLAGGER_HOME_HREF,
    items: FLAGGER_NAV_ITEMS,
  };
}
