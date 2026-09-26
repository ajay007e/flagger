import { cva } from "class-variance-authority";

export const avatarVariants = cva(
  [
    "inline-flex",
    "shrink-0",
    "select-none",
    "items-center",
    "justify-center",

    "rounded-full",
    "bg-primary",

    "font-semibold",
    "text-primary-foreground",
  ],
  {
    variants: {
      size: {
        sm: "h-7 w-7 text-xs",
        md: "h-9 w-9 text-sm",
        lg: "h-12 w-12 text-base",
      },
    },

    defaultVariants: {
      size: "md",
    },
  },
);
