import {
  Boxes,
  FolderKanban,
  Globe,
  LayoutDashboard,
  ScrollText,
  Users,
} from "lucide-react";

import type { SidebarItem } from "@/shared/components";

export const ADMIN_HOME_HREF = "/admin";

/** The admin area's sidebar. The sidebar itself is shared; this is only its content. */
export const ADMIN_NAV_ITEMS: readonly SidebarItem[] = [
  {
    label: "Dashboard",
    href: ADMIN_HOME_HREF,
    icon: LayoutDashboard,
    exact: true,
  },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Entities", href: "/admin/entities", icon: Boxes },
  { label: "Environments", href: "/admin/environments", icon: Globe },
  { label: "Audit", href: "/admin/audit", icon: ScrollText },
];
