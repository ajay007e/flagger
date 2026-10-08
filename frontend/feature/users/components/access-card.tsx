"use client";

import { Trash2 } from "lucide-react";
import { useMemo } from "react";

import { Button, Field, Notice } from "@/shared/components";

import { ALL_PROJECTS_VALUE } from "../user-access.constants";
import { useProjectEntities } from "../user-access.hook";
import type {
  AccessCardErrors,
  AccessDraft,
  AccessOption,
  RoleOption,
} from "../user-access.types";
import { buildAccessSummary } from "../user-access.utils";

interface AccessCardProps {
  index: number;
  card: AccessDraft;
  roles: readonly RoleOption[];
  projects: readonly AccessOption[];
  environments: readonly AccessOption[];
  errors: AccessCardErrors;
  disabled: boolean;
  onChange: (patch: Partial<AccessDraft>) => void;
  onRemove: () => void;
}

function toOptions(items: readonly AccessOption[]) {
  return items.map((item) => ({ value: String(item.id), label: item.name }));
}

export function AccessCard({
  index,
  card,
  roles,
  projects,
  environments,
  errors,
  disabled,
  onChange,
  onRemove,
}: AccessCardProps) {
  const {
    items: entities,
    loading: entitiesLoading,
    error: entitiesError,
  } = useProjectEntities(card.projectId);

  const projectOptions = useMemo(
    () => [
      { value: ALL_PROJECTS_VALUE, label: "All projects" },
      ...toOptions(projects),
    ],
    [projects],
  );
  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: String(role.id), label: role.name })),
    [roles],
  );
  const entityOptions = useMemo(() => toOptions(entities), [entities]);
  const environmentOptions = useMemo(
    () => toOptions(environments),
    [environments],
  );

  const role = roles.find((item) => item.id === card.roleId);
  const summary = buildAccessSummary(card, {
    roles,
    projects,
    entities,
    environments,
  });

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-border bg-muted/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Access {index + 1}</h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`Remove access ${index + 1}`}
          disabled={disabled}
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project" className="min-w-0" error={errors.projectId}>
          <Field.Select
            options={projectOptions}
            value={card.projectId === null ? "" : String(card.projectId)}
            disabled={disabled}
            onValueChange={(value) =>
              onChange({
                projectId: value === ALL_PROJECTS_VALUE ? null : Number(value),
                entityIds: [],
              })
            }
          />
        </Field>

        <Field
          label="Role"
          required
          className="min-w-0"
          error={errors.roleId}
          helperText={role?.description ?? undefined}
        >
          <Field.Select
            options={roleOptions}
            value={card.roleId === null ? "" : String(card.roleId)}
            placeholder="Select a role"
            disabled={disabled}
            onValueChange={(value) => onChange({ roleId: Number(value) })}
          />
        </Field>

        <Field
          label="Entities"
          className="min-w-0"
          error={errors.entityIds ?? entitiesError ?? undefined}
          helperText={
            card.projectId === null
              ? "Choose a project to pick specific entities."
              : entitiesLoading
                ? "Loading entities…"
                : undefined
          }
        >
          <Field.MultiSelect
            options={entityOptions}
            value={card.entityIds.map(String)}
            allLabel="All entities"
            disabled={disabled || card.projectId === null}
            onValueChange={(value) =>
              onChange({ entityIds: value.map(Number) })
            }
          />
        </Field>

        <Field
          label="Environments"
          className="min-w-0"
          error={errors.environmentIds}
        >
          <Field.MultiSelect
            options={environmentOptions}
            value={card.environmentIds.map(String)}
            allLabel="All environments"
            disabled={disabled}
            onValueChange={(value) =>
              onChange({ environmentIds: value.map(Number) })
            }
          />
        </Field>
      </div>

      {card.projectId === null ? (
        <Notice variant="warning" title="Access to every project">
          This role applies to all current and future projects and their
          entities.
        </Notice>
      ) : null}

      <p
        className="rounded-lg bg-muted/10 px-3 py-2 text-sm"
        aria-live="polite"
      >
        <span className="font-medium">Summary: </span>
        {summary}
      </p>
    </li>
  );
}
