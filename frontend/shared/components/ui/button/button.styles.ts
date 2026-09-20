import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  [
    "inline-flex",
    "items-center",
    "justify-center",
    "gap-2",

    "rounded-xl",

    "text-sm",
    "font-semibold",

    "transition-colors",

    "cursor-pointer",

    "disabled:cursor-not-allowed",
    "disabled:opacity-60",

    "focus-visible:outline-none",
    "focus-visible:ring-4",
    "focus-visible:ring-offset-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/30",

        secondary:
          "bg-surface text-foreground hover:bg-border focus-visible:ring-border",

        outline:
          "border border-border bg-transparent text-foreground hover:bg-surface focus-visible:ring-border",

        ghost:
          "text-muted hover:bg-surface hover:text-foreground focus-visible:ring-border",

        danger:
          "bg-danger text-danger-foreground hover:bg-danger/90 focus-visible:ring-danger/30 shadow-sm hover:shadow-md active:scale-95",

        success:
          "bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success/30",

        link: "text-primary underline underline-offset-2 hover:text-primary/80 hover:no-underline focus-visible:ring-primary/30",

        "danger-outline":
          "border border-danger/30 bg-transparent text-danger hover:bg-danger/10 focus-visible:ring-danger/30",
      },

      size: {
        xs: "h-8 px-3 text-xs",

        sm: "h-9 px-3 text-sm",

        md: "h-10 px-4 text-sm",

        lg: "h-12 px-6 text-sm",

        icon: "h-10 w-10 p-0",
      },

      fullWidth: {
        true: "w-full",
      },
    },

    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);
