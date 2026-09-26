import { AlertCircle } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { FormErrorProps } from "./form-error.types";

/**
 * A form-level error banner — for something that applies to the whole
 * submission (wrong credentials, a server error), not a single field. Field-
 * level errors still go through Field's own `error` prop, not this.
 */
export function FormError({ children, className }: FormErrorProps) {
  if (!children) {
    return null;
  }

  return (
    <p
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
