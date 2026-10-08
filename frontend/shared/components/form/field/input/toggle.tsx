"use client";

import { forwardRef, useId } from "react";

import { cn } from "@/shared/lib/utils";

import { useFieldContext } from "../field.context";
import type { FieldToggleProps } from "../field.types";

const FieldToggle = forwardRef<HTMLButtonElement, FieldToggleProps>(
  (
    { checked, onCheckedChange, label, id, disabled, className, ...props },
    ref,
  ) => {
    const field = useFieldContext();
    const generatedId = useId();
    const isDisabled = disabled || field?.disabled;

    return (
      <label
        className={cn(
          "inline-flex select-none items-center gap-2 text-sm",
          isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          className,
        )}
      >
        <button
          ref={ref}
          id={id ?? field?.id ?? generatedId}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-describedby={field?.describedBy}
          disabled={isDisabled}
          onClick={() => onCheckedChange(!checked)}
          className={cn(
            "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed",
            checked ? "border-primary bg-primary" : "border-border bg-muted/20",
          )}
          {...props}
        >
          <span
            aria-hidden="true"
            className={cn(
              "inline-block h-4 w-4 rounded-full shadow transition-transform",
              checked ? "translate-x-5 bg-surface" : "translate-x-1 bg-muted",
            )}
          />
        </button>

        {label ? <span className="min-w-0">{label}</span> : null}
      </label>
    );
  },
);

FieldToggle.displayName = "Field.Toggle";

export default FieldToggle;
