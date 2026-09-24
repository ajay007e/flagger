import { forwardRef } from "react";

import { cn } from "@/shared/lib/utils";

import { badgeVariants } from "./badge.styles";
import type { BadgeProps } from "./badge.types";

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { variant, size, leftIcon, rightIcon, children, className, ...props },
    ref,
  ) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {leftIcon}
        {children}
        {rightIcon}
      </span>
    );
  },
);

Badge.displayName = "Badge";

export default Badge;
