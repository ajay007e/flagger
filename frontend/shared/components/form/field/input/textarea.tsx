import { forwardRef } from "react";

import { cn } from "@/shared/lib/utils";

import { useFieldContext } from "../field.context";
import { inputVariants, inputWrapperVariants } from "./input.styles";
import type { FieldTextareaProps } from "../field.types";

const DEFAULT_ROWS = 4;

const FieldTextarea = forwardRef<HTMLTextAreaElement, FieldTextareaProps>(
  (
    { fullWidth = true, className, disabled, rows = DEFAULT_ROWS, ...props },
    ref,
  ) => {
    const field = useFieldContext();
    const isDisabled = disabled || field?.disabled;

    return (
      <div
        className={cn(
          inputWrapperVariants({
            size: field?.size,
            variant: field?.variant,
            state: field?.state,
            disabled: isDisabled,
            fullWidth,
          }),
          // Override the fixed input height: a textarea grows with its rows.
          "h-auto items-start py-2",
          className,
        )}
      >
        <textarea
          ref={ref}
          id={field?.id}
          required={field?.required}
          disabled={isDisabled}
          aria-invalid={field?.state === "invalid"}
          aria-describedby={field?.describedBy}
          rows={rows}
          className={cn(inputVariants(), "resize-y")}
          {...props}
        />
      </div>
    );
  },
);

FieldTextarea.displayName = "Field.Textarea";

export default FieldTextarea;
