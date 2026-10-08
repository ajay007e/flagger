import { cva } from "class-variance-authority";

export const modalPanelVariants = cva(
  [
    "relative",
    "flex",
    "w-full",
    "flex-col",

    "bg-surface",
    "text-foreground",

    "shadow-xl",
    "outline-none",

    "max-h-[90vh]",
    "rounded-t-2xl",
    "pb-[env(safe-area-inset-bottom)]",

    "sm:max-h-[85vh]",
    "sm:rounded-xl",
    "sm:border",
    "sm:border-border",
    "sm:pb-0",
  ],
  {
    variants: {
      size: {
        sm: "sm:max-w-sm",
        md: "sm:max-w-md",
        lg: "sm:max-w-lg",
        xl: "sm:max-w-2xl",
      },
    },

    defaultVariants: {
      size: "md",
    },
  },
);
