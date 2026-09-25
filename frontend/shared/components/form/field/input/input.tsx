"use client";

import { Eye, EyeOff, Loader2, X } from "lucide-react";
import { forwardRef, useState, type ChangeEvent, type ReactNode } from "react";

import { Button } from "@/shared/components/ui";
import { cn } from "@/shared/lib/utils";

import { useFieldContext } from "../field.context";
import { inputVariants, inputWrapperVariants } from "./input.styles";
import type { FieldInputProps } from "../field.types";

const ADORNMENT_BUTTON_CLASS = "h-6 w-6 shrink-0";

const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(
  (
    {
      type = "text",
      leftIcon,
      rightIcon,
      loading,
      clearable,
      onClear,
      showPasswordToggle,
      fullWidth = true,
      className,
      disabled,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref,
  ) => {
    const field = useFieldContext();
    const isDisabled = disabled || field?.disabled;

    const [passwordVisible, setPasswordVisible] = useState(false);
    // Tracked independently of `value`/`defaultValue` so `clearable` also works
    // with an uncontrolled input driven by a ref (e.g. react-hook-form's
    // register(), which never passes a `value` prop).
    const [hasValue, setHasValue] = useState(
      Boolean(value ?? defaultValue ?? ""),
    );

    const isPassword = type === "password";
    const inputType = isPassword && passwordVisible ? "text" : type;

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      onChange?.(event);
      setHasValue(event.target.value.length > 0);
    }

    function handleClear() {
      onClear?.();
      setHasValue(false);
    }

    // Exactly one end adornment renders, in this priority order, so a loading
    // state can never sit next to a clear button or a password toggle.
    let endAdornment: ReactNode = null;

    if (loading) {
      endAdornment = (
        <Loader2
          className="h-4 w-4 shrink-0 animate-spin text-muted"
          aria-hidden="true"
        />
      );
    } else if (showPasswordToggle && isPassword) {
      endAdornment = (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isDisabled}
          onClick={() => setPasswordVisible((visible) => !visible)}
          aria-label={passwordVisible ? "Hide password" : "Show password"}
          className={ADORNMENT_BUTTON_CLASS}
        >
          {passwordVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      );
    } else if (clearable && hasValue) {
      endAdornment = (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isDisabled}
          onClick={handleClear}
          aria-label="Clear"
          className={ADORNMENT_BUTTON_CLASS}
        >
          <X className="h-4 w-4" />
        </Button>
      );
    } else if (rightIcon) {
      endAdornment = (
        <span className="shrink-0 text-muted" aria-hidden="true">
          {rightIcon}
        </span>
      );
    }

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
          "gap-2",
          className,
        )}
      >
        {leftIcon ? (
          <span className="shrink-0 text-muted" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}

        <input
          ref={ref}
          id={field?.id}
          type={inputType}
          required={field?.required}
          disabled={isDisabled}
          aria-invalid={field?.state === "invalid"}
          aria-describedby={field?.describedBy}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          className={inputVariants()}
          {...props}
        />

        {endAdornment}
      </div>
    );
  },
);

FieldInput.displayName = "Field.Input";

export default FieldInput;
