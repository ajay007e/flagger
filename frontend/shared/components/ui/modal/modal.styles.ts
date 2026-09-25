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

    // Mobile: a bottom sheet — anchored to the bottom edge (see the wrapper's
    // items-end), rounded top corners only, capped height so the backdrop
    // stays visible above it rather than taking over the whole screen.
    "max-h-[90vh]",
    "rounded-t-2xl",
    "pb-[env(safe-area-inset-bottom)]",

    // sm and up: a centered card instead, all corners rounded, bordered.
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
      },
    },

    defaultVariants: {
      size: "md",
    },
  },
);
