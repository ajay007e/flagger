import { cva } from "class-variance-authority";

/**
 * The wrapper around the actual <input>/<textarea>. Icons and buttons are laid
 * out as flex siblings here rather than absolutely positioned over the input,
 * so they can never overlap the text or each other, and no manual padding
 * math (pl-11, pr-10, ...) is needed to make room for them.
 */
export const inputWrapperVariants = cva(
  [
    "flex",
    "items-center",

    "rounded-lg",
    "border",

    "transition-colors",

    "focus-within:outline-none",
    "focus-within:ring-2",
    "focus-within:ring-offset-0",
  ],
  {
    variants: {
      size: {
        sm: "h-9 px-2.5 text-sm",
        md: "h-10 px-3 text-sm",
        lg: "h-12 px-3.5 text-base",
      },

      variant: {
        outline: "bg-surface",
        filled: "border-transparent bg-surface",
        ghost: "border-transparent bg-transparent",
      },

      state: {
        default:
          "border-border focus-within:border-primary focus-within:ring-primary/30",
        invalid:
          "border-danger focus-within:border-danger focus-within:ring-danger/30",
        success:
          "border-success focus-within:border-success focus-within:ring-success/30",
      },

      disabled: {
        true: "cursor-not-allowed opacity-60",
      },

      fullWidth: {
        true: "w-full",
      },
    },

    defaultVariants: {
      size: "md",
      variant: "outline",
      state: "default",
    },
  },
);

export const inputVariants = cva([
  "min-w-0",
  "flex-1",

  "bg-transparent",

  "text-foreground",
  "placeholder:text-muted",

  "outline-none",

  "disabled:cursor-not-allowed",
]);
