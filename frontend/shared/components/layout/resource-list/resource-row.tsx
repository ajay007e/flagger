import type { ReactNode } from "react";

import { Badge } from "@/shared/components/ui";
import { cn } from "@/shared/lib/utils";

interface ResourceRowProps {
  name: ReactNode;
  itemKey: string;
  description: string | null;
  deleted: boolean;
  actions: ReactNode;
  leading?: ReactNode;
}

/** One row: stacks on mobile, side by side from `sm` up. */
export function ResourceRow({
  name,
  itemKey,
  description,
  deleted,
  actions,
  leading,
}: ResourceRowProps) {
  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-muted/5 p-4 transition-colors hover:bg-muted/10 sm:flex-row sm:items-center sm:justify-between",
        deleted && "border-dashed opacity-70",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {leading !== undefined && leading !== null ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/10 text-sm font-medium text-muted">
            {leading}
          </span>
        ) : null}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "min-w-0 break-words font-medium",
                deleted && "line-through",
              )}
            >
              {name}
            </span>
            <Badge variant="outline">{itemKey}</Badge>
            {deleted ? <Badge variant="danger">Deleted</Badge> : null}
          </div>
          {description ? (
            <p className="mt-1 break-words text-sm text-muted">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
        {actions}
      </div>
    </li>
  );
}
