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
        // min-w-0: a flex item's default min-width is its content's natural
        // width, which silently defeats truncate below. w-full: fills the
        // sidebar's actual width instead of shrink-wrapping to content.
        "flex w-full min-w-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted hover:bg-surface hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  );
}

/**
 * Presentational: renders whatever items it is given, so the same component
 * serves the Flagger area and the admin area (and any later one). Which items
 * to show is decided by the caller. Used both as the fixed desktop sidebar and
 * inside the mobile drawer.
 */
export function Sidebar({ items, onNavigate, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sidebar"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    >
      {items.map((item) => (
        <SidebarLink
          key={item.href}
          item={item}
          active={isActive(pathname, item)}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
