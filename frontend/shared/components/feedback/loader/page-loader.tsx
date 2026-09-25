import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

import { cn } from "@/shared/lib/utils";

import { LOADER_SIZE_CLASSES } from "./loader.constants";
import type { PageLoaderProps } from "./loader.types";

/**
 * Full-viewport loading overlay, e.g. while checking auth on first load.
 * `fixed` positioning takes it out of the normal layout flow entirely, so it
 * can be dropped in from anywhere without affecting surrounding content.
 */
const PageLoader = forwardRef<HTMLDivElement, PageLoaderProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background",
          className,
        )}
        {...props}
      >
        <Loader2
          className={cn(LOADER_SIZE_CLASSES.lg, "animate-spin text-primary")}
        />
        {label ? (
          <span className="text-sm text-muted">{label}</span>
        ) : (
          <span className="sr-only">Loading</span>
        )}
      </div>
    );
  },
);

PageLoader.displayName = "PageLoader";

export default PageLoader;
