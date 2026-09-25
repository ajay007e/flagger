import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

import { cn } from "@/shared/lib/utils";

import { DEFAULT_LOADER_SIZE, LOADER_SIZE_CLASSES } from "./loader.constants";
import type { ComponentLoaderProps } from "./loader.types";

/**
 * Inline loading state for a card, section, or panel. Sized to sit within its
 * container, does not take over the page. For that, use PageLoader.
 */
const ComponentLoader = forwardRef<HTMLDivElement, ComponentLoaderProps>(
  ({ size = DEFAULT_LOADER_SIZE, label, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        className={cn(
          "flex flex-col items-center justify-center gap-2 p-6 text-muted",
          className,
        )}
        {...props}
      >
        <Loader2 className={cn(LOADER_SIZE_CLASSES[size], "animate-spin")} />
        {label ? (
          <span className="text-sm">{label}</span>
        ) : (
          <span className="sr-only">Loading</span>
        )}
      </div>
    );
  },
);

ComponentLoader.displayName = "ComponentLoader";

export default ComponentLoader;
