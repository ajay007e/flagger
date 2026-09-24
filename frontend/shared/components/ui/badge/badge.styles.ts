import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  [
    "inline-flex",
    "items-center",
    "gap-1",

    "rounded-full",
    "border",

    "font-medium",
    "whitespace-nowrap",
  ],
  {
    variants: {
      variant: {
        default: "border-border bg-surface text-foreground",
        success: "border-transparent bg-success text-success-foreground",
        danger: "border-transparent bg-danger text-danger-foreground",
        warning: "border-transparent bg-warning text-warning-foreground",
        outline: "border-border bg-transparent text-foreground",
      },

      size: {
        sm: "h-5 px-2 text-xs",
        md: "h-6 px-2.5 text-xs",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);
