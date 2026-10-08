"use client";

import { Plus } from "lucide-react";
import type { ReactNode } from "react";

import { ComponentLoader } from "@/shared/components/feedback";
import { FormError } from "@/shared/components/form";
import { Button } from "@/shared/components/ui";
import { ResourceToolbar } from "./resource-toolbar";

interface ResourceListProps {
  title: string;
  description?: string;
  level?: "page" | "section";
  createLabel: string;
  onCreate: () => void;
  showDeleted?: boolean;
  onShowDeletedChange?: (value: boolean) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  isEmpty: boolean;
  emptyText: string;
  children: ReactNode;
  search?: ReactNode;
  filters?: ReactNode;
}

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
  search,
  filters,
}: ResourceListProps) {
  const Heading = level === "page" ? "h1" : "h2";

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Heading
            className={
              level === "page"
                ? "text-2xl font-semibold tracking-tight"
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
          className="w-full shrink-0 sm:w-auto"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={onCreate}
        >
          {createLabel}
        </Button>
      </header>

      <ResourceToolbar
        showDeleted={showDeleted}
        onShowDeletedChange={onShowDeletedChange}
        search={search}
        filters={filters}
      />

      {error ? (
        <div className="flex flex-col items-start gap-3">
          <FormError>{error}</FormError>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : loading ? (
        <ComponentLoader label="Loading…" />
      ) : isEmpty ? (
        <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted">
          {emptyText}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">{children}</ul>
      )}
    </section>
  );
}
