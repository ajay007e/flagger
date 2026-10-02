import type { ReactNode } from "react";

import { Badge } from "@/shared/components/ui";
import { cn } from "@/shared/lib/utils";

interface ResourceRowProps {
  name: ReactNode;
  itemKey: string;
  description: string | null;
  deleted: boolean;
  actions: ReactNode;
}

/** One row: stacks on mobile, side by side from `sm` up. */
export function ResourceRow({
  name,
  itemKey,
  description,
  deleted,
  actions,
}: ResourceRowProps) {
  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between",
        deleted && "opacity-70",
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 break-words font-medium">{name}</span>
          <Badge variant="outline">{itemKey}</Badge>
          {deleted ? <Badge variant="danger">Deleted</Badge> : null}
        </div>
        {description ? (
          <p className="mt-1 break-words text-sm text-muted">{description}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {actions}
      </div>
    </li>
  );
}
