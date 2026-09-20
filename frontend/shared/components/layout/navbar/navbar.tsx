import Link from "next/link";

import { APP_NAME } from "@/shared/config";
import { cn } from "@/shared/lib";
import { ThemeSwitcher } from "@/shared/theme";

import type { NavbarProps } from "./types";

export function Navbar({ children, className }: NavbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur",
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
