import { cva } from "class-variance-authority";

export const toastVariants = cva(
  [
    "pointer-events-auto",
    "flex",
    "w-full",
    "max-w-sm",
    "items-start",
    "gap-3",

    "rounded-lg",
    "border",
    "bg-surface",

    "p-3",
    "shadow-lg",
  ],
  {
    variants: {
      variant: {
        success: "border-success/30",
        error: "border-danger/30",
        warning: "border-warning/30",
        info: "border-primary/30",
      },
    },

    defaultVariants: {
      variant: "info",
    },
  },
);

export const toastIconVariants = cva(["mt-0.5", "h-5", "w-5", "shrink-0"], {
  variants: {
    variant: {
      success: "text-success",
      error: "text-danger",
      warning: "text-warning",
      info: "text-primary",
    },
  },

  defaultVariants: {
    variant: "info",
  },
});
