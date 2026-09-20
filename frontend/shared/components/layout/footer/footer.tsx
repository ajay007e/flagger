import { APP_NAME, REPO_URL } from "@/shared/config";
import { cn } from "@/shared/lib";
import type { FooterProps } from "./types";

export function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("mt-auto w-full border-t border-border", className)}>
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-sm text-muted sm:flex-row sm:px-6 sm:text-left">
        <p>
          &copy; {year} {APP_NAME}
        </p>

        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-foreground"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
