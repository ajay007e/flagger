import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { cn } from "@/shared/lib/utils";

interface PagerProps {
  page: number;
  totalPages: number;
  total: number;
  disabled?: boolean;
  className?: string;
  onPageChange: (page: number) => void;
}

export function Pager({
  page,
  totalPages,
  total,
  disabled = false,
  className,
  onPageChange,
}: PagerProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted">
        Page {page} of {totalPages} · {total} total
      </p>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
          leftIcon={<ChevronLeft className="h-4 w-4" />}
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
          rightIcon={<ChevronRight className="h-4 w-4" />}
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
