import type { LucideIcon } from "lucide-react";

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Only highlight on an exact path match. Needed for an area's home link
   * ("/", "/admin"), which would otherwise match every page under it. */
  exact?: boolean;
}

export interface SidebarProps {
  items: readonly SidebarItem[];
  /** Pinned to the bottom, visually separate: the link to the other area. */
  footerItem?: SidebarItem;
  /** Called when a link is followed — the mobile drawer uses it to close itself. */
  onNavigate?: () => void;
  className?: string;
}
