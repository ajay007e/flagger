import Link from "next/link";

import { APP_NAME } from "@/shared/config";
import { cn } from "@/shared/lib/utils";
import { ThemeSwitcher } from "@/shared/theme";

import type { NavbarProps } from "./types";

export function Navbar({ children, className }: NavbarProps) {
  return (
    <header
      className={cn(
        // Solid background, not blurred/translucent: backdrop-filter on an
        // ancestor becomes the containing block for any position:fixed
        // descendant (e.g. AccountMenu's mobile sidebar via Popover), trapping
        // it inside the navbar's own height instead of the full viewport.
        "sticky top-0 z-40 w-full border-b border-border bg-background",
        className,
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6"
      >
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {APP_NAME}
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {children}
          <ThemeSwitcher />
        </div>
      </nav>
    </header>
  );
}
