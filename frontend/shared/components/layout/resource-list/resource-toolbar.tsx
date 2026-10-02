import type { ReactNode } from "react";

interface ResourceToolbarProps {
  showDeleted: boolean;
  onShowDeletedChange: (value: boolean) => void;
  /** Grows to fill the row. Put the search input here later. */
  search?: ReactNode;
  /** Sits before the "Show deleted" toggle. Put filter selects here later. */
  filters?: ReactNode;
}

/**
 * The bar above an admin list. Stacks on mobile (search, then filters, then
 * the toggle) and becomes one row from `sm` up.
 */
export function ResourceToolbar({
  showDeleted,
  onShowDeletedChange,
  search,
  filters,
}: ResourceToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/5 p-3 sm:flex-row sm:items-center">
      {search ? <div className="min-w-0 sm:flex-1">{search}</div> : null}

      <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
        {filters}

        <label className="flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted hover:bg-muted/10">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={showDeleted}
            onChange={(event) => onShowDeletedChange(event.target.checked)}
          />
          Show deleted
        </label>
      </div>
    </div>
  );
}
