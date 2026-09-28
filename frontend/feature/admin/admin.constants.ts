import { Boxes, FolderKanban, Globe, ScrollText, Users } from "lucide-react";

import type { AdminNavItem } from "./admin.types";

export const ADMIN_HOME_HREF = "/admin";
export const FLAGGER_HOME_HREF = "/";

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Entities", href: "/admin/entities", icon: Boxes },
  { label: "Environments", href: "/admin/environments", icon: Globe },
  { label: "Audit", href: "/admin/audit", icon: ScrollText },
];
