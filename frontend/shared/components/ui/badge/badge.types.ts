import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant =
  "default" | "success" | "danger" | "warning" | "outline";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}
