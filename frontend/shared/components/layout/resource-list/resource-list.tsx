"use client";

import { Plus } from "lucide-react";
import type { ReactNode } from "react";

import { ComponentLoader } from "@/shared/components/feedback";
import { FormError } from "@/shared/components/form";
import { Button } from "@/shared/components/ui";

interface ResourceListProps {
  title: string;
  description?: string;
  /** "page" renders an h1, "section" an h2 (e.g. entities inside a project). */
  level?: "page" | "section";
  createLabel: string;
  onCreate: () => void;
  showDeleted: boolean;
  onShowDeletedChange: (value: boolean) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  isEmpty: boolean;
  emptyText: string;
  children: ReactNode;
}

/** Header, "show deleted" toggle and loading/error/empty states for an admin list. */
export function ResourceList({
  title,
  description,
  level = "page",
  createLabel,
  onCreate,
  showDeleted,
  onShowDeletedChange,
  loading,
  error,
  onRetry,
  isEmpty,
  emptyText,
  children,
}: ResourceListProps) {
  const Heading = level === "page" ? "h1" : "h2";

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Heading
            className={
              level === "page"
                ? "text-xl font-semibold"
                : "text-lg font-semibold"
            }
          >
            {title}
          </Heading>
          {description ? (
            <p className="mt-1 text-sm text-muted">{description}</p>
          ) : null}
        </div>

        <Button
          className="shrink-0"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={onCreate}
        >
          {createLabel}
        </Button>
      </header>

      <label className="flex w-fit items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={showDeleted}
          onChange={(event) => onShowDeletedChange(event.target.checked)}
        />
        Show deleted
      </label>

      {error ? (
        <div className="flex flex-col items-start gap-2">
          <FormError>{error}</FormError>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : loading ? (
        <ComponentLoader label="Loading…" />
      ) : isEmpty ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
          {emptyText}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">{children}</ul>
      )}
    </section>
  );
}
