import { AlertTriangle, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type NoticeVariant = "warning" | "info";

interface NoticeProps {
  variant?: NoticeVariant;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const STYLES: Record<NoticeVariant, { box: string; icon: string }> = {
  warning: { box: "border-warning/30 bg-warning/10", icon: "text-warning" },
  info: { box: "border-primary/30 bg-primary/10", icon: "text-primary" },
};

export function Notice({
  variant = "warning",
  title,
  children,
  className,
}: NoticeProps) {
  const Icon = variant === "warning" ? AlertTriangle : Info;

  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm text-foreground",
        STYLES[variant].box,
        className,
      )}
    >
      <Icon
        className={cn("mt-0.5 h-4 w-4 shrink-0", STYLES[variant].icon)}
        aria-hidden="true"
      />
      <div className="min-w-0">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? (
          <div className={title ? "text-muted" : undefined}>{children}</div>
        ) : null}
      </div>
    </div>
  );
}
