"use client";

import { Moon, Sun } from "lucide-react";

import Button from "@/shared/components/ui/button/button";
import { useTheme } from "@/shared/theme/theme.provider";

export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      leftIcon={
        <>
          <Moon className="h-5 w-5 dark:hidden" />
          <Sun className="hidden h-5 w-5 dark:block" />
        </>
      }
    />
  );
}
