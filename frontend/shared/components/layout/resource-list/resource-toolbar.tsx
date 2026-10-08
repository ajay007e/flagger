import type { ReactNode } from "react";
import { Field } from "@/shared/components/form";

interface ResourceToolbarProps {
  showDeleted?: boolean;
  onShowDeletedChange?: (value: boolean) => void;
  search?: ReactNode;
  filters?: ReactNode;
}

export function ResourceToolbar({
  showDeleted = false,
  onShowDeletedChange,
  search,
  filters,
}: ResourceToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/5 p-3 sm:flex-row sm:items-center">
      {search ? <div className="min-w-0 sm:flex-1">{search}</div> : null}

      <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
        {filters}

        {onShowDeletedChange ? (
          <Field.Toggle
            label="Show deleted"
            checked={showDeleted}
            onCheckedChange={onShowDeletedChange}
            className="h-10 rounded-lg border border-border px-3 text-muted hover:bg-muted/10"
          />
        ) : null}
      </div>
    </div>
  );
}
