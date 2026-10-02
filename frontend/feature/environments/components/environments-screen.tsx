"use client";

import {
  ChevronDown,
  ChevronUp,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import {
  Button,
  ConfirmDialog,
  ResourceList,
  ResourceRow,
} from "@/shared/components";
import { useAction } from "@/shared/hooks";

import { useEnvironments } from "../environments.hook";
import { environmentsService } from "../environments.service";
import type { Environment } from "../environments.types";
import { EnvironmentFormModal } from "./environment-form-modal";

export function EnvironmentsScreen() {
  const [showDeleted, setShowDeleted] = useState(false);
  const { data, loading, error, refetch } = useEnvironments(showDeleted);
  const { busy, run } = useAction(refetch);

  // null = closed, { environment: null } = create, otherwise edit.
  const [form, setForm] = useState<{ environment: Environment | null } | null>(
    null,
  );
  const [toDelete, setToDelete] = useState<Environment | null>(null);

  const environments = data ?? [];
  const activeIds = environments.filter((e) => !e.deletedAt).map((e) => e.id);

  function move(id: number, direction: -1 | 1): void {
    const ids = [...activeIds];
    const from = ids.indexOf(id);
    const to = from + direction;

    if (to < 0 || to >= ids.length) return;

    [ids[from], ids[to]] = [ids[to], ids[from]];
    void run(() => environmentsService.reorder(ids));
  }

  async function confirmDelete(): Promise<void> {
    if (!toDelete) return;

    await run(
      () => environmentsService.remove(toDelete.id),
      "Environment deleted",
    );
    setToDelete(null);
  }

  return (
    <>
      <ResourceList
        title="Environments"
        description="The order here is the order shown across the app."
        createLabel="New environment"
        onCreate={() => setForm({ environment: null })}
        showDeleted={showDeleted}
        onShowDeletedChange={setShowDeleted}
        // Keep the list on screen during refetches (reorder, restore).
        loading={loading && !data}
        error={error}
        onRetry={refetch}
        isEmpty={environments.length === 0}
        emptyText="No environments yet."
      >
        {environments.map((env) => {
          const deleted = Boolean(env.deletedAt);
          const position = activeIds.indexOf(env.id);

          return (
            <ResourceRow
              key={env.id}
              name={env.name}
              itemKey={env.key}
              description={env.description}
              deleted={deleted}
              actions={
                deleted ? (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () => environmentsService.restore(env.id),
                        "Environment restored",
                      )
                    }
                  >
                    Restore
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Move ${env.name} up`}
                      disabled={busy || position === 0}
                      onClick={() => move(env.id, -1)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Move ${env.name} down`}
                      disabled={busy || position === activeIds.length - 1}
                      onClick={() => move(env.id, 1)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Pencil className="h-4 w-4" />}
                      onClick={() => setForm({ environment: env })}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger-outline"
                      size="sm"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => setToDelete(env)}
                    >
                      Delete
                    </Button>
                  </>
                )
              }
            />
          );
        })}
      </ResourceList>

      <EnvironmentFormModal
        open={form !== null}
        environment={form?.environment ?? null}
        onClose={() => setForm(null)}
        onSaved={() => {
          setForm(null);
          void refetch();
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete environment?"
        description={`"${toDelete?.name ?? ""}" will be hidden. You can restore it later; its key stays reserved.`}
        confirmLabel="Delete"
        loading={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
