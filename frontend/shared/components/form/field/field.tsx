import { useId } from "react";

import { cn } from "@/shared/lib/utils";

import { FieldContext } from "./field.context";
import FieldInput from "./input/input";
import {
  fieldVariants,
  helperVariants,
  labelVariants,
  messageVariants,
} from "./field.styles";
import FieldTextarea from "./input/textarea";
import type { FieldComponent, FieldProps, FieldState } from "./field.types";

function FieldBase({
  id,
  label,
  children,
  helperText,
  error,
  success,
  required,
  optional,
  disabled,
  size = "md",
  variant = "outline",
  counter,
  maxLength,
  className,
  labelClassName,
  messageClassName,
  helperClassName,
}: FieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;

  const message = error ?? success ?? helperText;
  const showCounter =
    typeof counter === "number" && typeof maxLength === "number";

  const state: FieldState = error ? "invalid" : success ? "success" : "default";

  return (
    <FieldContext.Provider
      value={{
        id: fieldId,
        required,
        disabled,
        state,
        describedBy: message ? messageId : undefined,
        size,
        variant,
      }}
    >
      <div className={cn(fieldVariants(), className)}>
        {label ? (
          <label
            htmlFor={fieldId}
            className={cn(labelVariants({ disabled }), labelClassName)}
          >
            {label}

            {required ? <span className="ml-1 text-danger">*</span> : null}

            {optional && !required ? (
              <span className="ml-2 text-xs text-muted">Optional</span>
            ) : null}
          </label>
        ) : null}

        {children}

        {message || showCounter ? (
          <div className="flex items-start justify-between gap-4">
            {message ? (
              <p
                id={messageId}
                className={cn(
                  state === "invalid"
                    ? messageVariants({ state: "error" })
                    : state === "success"
                      ? messageVariants({ state: "success" })
                      : helperVariants(),
                  state === "default" ? helperClassName : messageClassName,
                )}
              >
                {message}
              </p>
            ) : (
              <span />
            )}

            {showCounter ? (
              <span className="shrink-0 text-xs text-muted">
                {counter}/{maxLength}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

const Field = Object.assign(FieldBase, {
  Input: FieldInput,
  Textarea: FieldTextarea,
}) as FieldComponent;

export default Field;
