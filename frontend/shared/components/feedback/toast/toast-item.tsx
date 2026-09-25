import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import Button from "@/shared/components/ui/button/button";
import { cn } from "@/shared/lib/utils";

import { dismiss } from "./toast.store";
import { toastIconVariants, toastVariants } from "./toast.styles";
import type { Toast, ToastVariant } from "./toast.types";

const VARIANT_ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export function ToastItem({ toast }: { toast: Toast }) {
  const Icon = VARIANT_ICONS[toast.variant];

  return (
    <div role="alert" className={cn(toastVariants({ variant: toast.variant }))}>
      <Icon
        className={cn(toastIconVariants({ variant: toast.variant }))}
        aria-hidden="true"
      />

      <div className="flex-1 text-sm text-foreground">
        {toast.message}

        {toast.action ? (
          <button
            type="button"
            onClick={toast.action.onClick}
            className="ml-2 font-medium text-primary underline underline-offset-2 hover:no-underline"
          >
            {toast.action.label}
          </button>
        ) : null}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
        className="h-6 w-6 shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
