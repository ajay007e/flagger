"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/utils";

import type { SidebarItem, SidebarProps } from "./sidebar.types";

function isActive(pathname: string, item: SidebarItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function SidebarLink({
  item,
  active,
  onNavigate,
}: {
  item: SidebarItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted hover:bg-surface hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

/**
 * Presentational: renders whatever items it is given, so the same component
 * serves the Flagger area and the admin area (and any later one). Which items
 * to show is decided by the caller. Used both as the fixed desktop sidebar and
 * inside the mobile drawer.
 */
export function Sidebar({
  items,
  footerItem,
  onNavigate,
  className,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex flex-col justify-between gap-6", className)}>
      <nav aria-label="Sidebar" className="flex flex-col gap-1">
        {items.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={isActive(pathname, item)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {footerItem ? (
        <div className="border-t border-border pt-4">
          <SidebarLink
            item={footerItem}
            active={false}
            onNavigate={onNavigate}
          />
        </div>
      ) : null}
    </div>
  );
}
