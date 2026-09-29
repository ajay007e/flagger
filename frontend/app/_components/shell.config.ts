import { ArrowLeft, ArrowRight, LayoutDashboard } from "lucide-react";

import { ADMIN_HOME_HREF, ADMIN_NAV_ITEMS } from "@/feature/admin";
import type { SidebarItem } from "@/shared/components";
import { APP_NAME } from "@/shared/config";

export const FLAGGER_HOME_HREF = "/";

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
  /** The link to the other area. Only admins have another area to go to. */
  footerItem?: SidebarItem;
}

function isAdminPath(pathname: string): boolean {
  return (
    pathname === ADMIN_HOME_HREF || pathname.startsWith(`${ADMIN_HOME_HREF}/`)
  );
}

/**
 * What the navbar title and sidebar show, from where the user is and who they
 * are. A non-admin on an /admin path gets the Flagger config, not the admin
 * one: app/admin/layout.tsx is about to redirect them, and they should never
 * see admin links in the meantime.
 */
export function getShellConfig(
  pathname: string,
  userType: string,
): ShellConfig {
  const isAdmin = userType === "admin";

  if (isAdmin && isAdminPath(pathname)) {
    return {
      title: `${APP_NAME} Admin`,
      titleHref: ADMIN_HOME_HREF,
      items: ADMIN_NAV_ITEMS,
      footerItem: {
        label: `Back to ${APP_NAME}`,
        href: FLAGGER_HOME_HREF,
        icon: ArrowLeft,
      },
    };
  }

  return {
    title: APP_NAME,
    titleHref: FLAGGER_HOME_HREF,
    items: FLAGGER_NAV_ITEMS,
    footerItem: isAdmin
      ? { label: "Go to Admin", href: ADMIN_HOME_HREF, icon: ArrowRight }
      : undefined,
  };
}
