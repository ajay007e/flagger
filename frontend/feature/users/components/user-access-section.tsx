"use client";

import { Plus } from "lucide-react";

import { Button, ComponentLoader, FormError } from "@/shared/components";

import { useAccessOptions } from "../user-access.hook";
import type { AccessCardErrors, AccessDraft } from "../user-access.types";
import { createDraft } from "../user-access.utils";
import { AccessCard } from "./access-card";

interface UserAccessSectionProps {
  cards: AccessDraft[];
  errors: Record<string, AccessCardErrors>;
  disabled: boolean;
  onChange: (cards: AccessDraft[]) => void;
}

export function UserAccessSection({
  cards,
  errors,
  disabled,
  onChange,
}: UserAccessSectionProps) {
  const { projects, environments, roles, loading, error, refetch } =
    useAccessOptions();

  function update(key: string, patch: Partial<AccessDraft>) {
    onChange(
      cards.map((card) => (card.key === key ? { ...card, ...patch } : card)),
    );
  }

  function remove(key: string) {
    onChange(cards.filter((card) => card.key !== key));
  }

  function add() {
    onChange([...cards, createDraft({ projectId: projects[0]?.id ?? null })]);
  }

  return (
    <section
      aria-label="Access"
      className="flex flex-col gap-4 border-t border-border py-4"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold">Access</h3>
        <p className="text-sm text-muted">
          Choose a project, a role, and where it applies. Keep All entities or
          All environments to include everything.
        </p>
      </div>

      {error ? (
        <div className="flex flex-col items-start gap-3">
          <FormError>{error}</FormError>
          <Button variant="outline" size="sm" onClick={refetch}>
            Retry
          </Button>
        </div>
      ) : loading ? (
        <ComponentLoader label="Loading…" />
      ) : cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
          No access assigned yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {cards.map((card, index) => (
            <AccessCard
              key={card.key}
              index={index}
              card={card}
              roles={roles}
              projects={projects}
              environments={environments}
              errors={errors[card.key] ?? {}}
              disabled={disabled}
              onChange={(patch) => update(card.key, patch)}
              onRemove={() => remove(card.key)}
            />
          ))}
        </ul>
      )}

      <Button
        variant="outline"
        className="w-full sm:w-auto sm:self-start"
        leftIcon={<Plus className="h-4 w-4" />}
        disabled={disabled || loading || Boolean(error)}
        onClick={add}
      >
        Add access
      </Button>
    </section>
  );
}
