import { cva } from "class-variance-authority";

export const fieldVariants = cva(["flex", "w-full", "flex-col", "gap-1.5"]);

export const labelVariants = cva(
  ["text-sm", "font-medium", "text-foreground"],
  {
    variants: {
      disabled: {
        true: "opacity-60",
      },
    },
  },
);

export const messageVariants = cva(["text-xs"], {
  variants: {
    state: {
      error: "text-danger",
      success: "text-success",
    },
  },
});

export const helperVariants = cva(["text-xs", "text-muted"]);
