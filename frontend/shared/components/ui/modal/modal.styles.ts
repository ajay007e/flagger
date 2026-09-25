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

    // Full-screen sheet below sm:, centered card from sm: up.
    "h-full",
    "sm:h-auto",
    "sm:max-h-[85vh]",
    "sm:rounded-xl",
    "sm:border",
    "sm:border-border",
  ],
  {
    variants: {
      size: {
        sm: "sm:max-w-sm",
        md: "sm:max-w-md",
        lg: "sm:max-w-lg",
      },
    },

    defaultVariants: {
      size: "md",
    },
  },
);
