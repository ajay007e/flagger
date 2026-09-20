import { Loader2 } from "lucide-react";
import React from "react";

import { cn } from "@/shared/lib/utils";

import { buttonVariants } from "./button.styles";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success"
    | "link"
    | "danger-outline";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant,
      size,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      fullWidth,
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          buttonVariants({
            variant,
            size,
            fullWidth,
          }),
          loading && "cursor-wait",
          disabled && !loading && "cursor-not-allowed",
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && leftIcon}
        {children ? <span>{children}</span> : null}
        {!loading && rightIcon}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
