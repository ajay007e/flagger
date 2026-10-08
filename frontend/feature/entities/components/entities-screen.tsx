"use client";

import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Button,
  ConfirmDialog,
  Pager,
  ResourceList,
  ResourceRow,
} from "@/shared/components";
import { useAction } from "@/shared/hooks";

import { useEntities } from "../entities.hook";
import { entitiesService } from "../entities.service";
import type { Entity } from "../entities.types";
import { EntityFormModal } from "./entity-form-modal";

import { ENTITIES_PAGE_SIZE } from "../entities.constants";

export function EntitiesScreen({ projectId }: { projectId: number }) {
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useEntities(
    projectId,
    page,
    ENTITIES_PAGE_SIZE,
    showDeleted,
  );
  const { busy, run } = useAction(refetch);

  const [form, setForm] = useState<{ entity: Entity | null } | null>(null);
  const [toDelete, setToDelete] = useState<Entity | null>(null);

  const entities = data?.items ?? [];
  const meta = data?.meta;

  useEffect(() => {
    if (data && data.items.length === 0 && page > 1) {
      setPage(Math.max(1, data.meta.totalPages));
    }
  }, [data, page]);

  async function confirmDelete(): Promise<void> {
    if (!toDelete) return;

    await run(
      () => entitiesService.remove(projectId, toDelete.id),
      "Entity deleted",
    );
    setToDelete(null);
  }

  return (
    <>
      <ResourceList
        level="section"
        title="Entities"
        createLabel="New entity"
        onCreate={() => setForm({ entity: null })}
        showDeleted={showDeleted}
        onShowDeletedChange={(value) => {
          setShowDeleted(value);
          setPage(1);
        }}
        loading={loading && !data}
        error={error}
        onRetry={refetch}
        isEmpty={entities.length === 0}
        emptyText="This project has no entities yet."
      >
        {entities.map((entity) => {
          const deleted = Boolean(entity.deletedAt);

          return (
            <ResourceRow
              key={entity.id}
              name={entity.name}
              itemKey={entity.key}
              description={entity.description}
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
                        () => entitiesService.restore(projectId, entity.id),
                        "Entity restored",
                      )
                    }
                  >
                    Restore
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Pencil className="h-4 w-4" />}
                      onClick={() => setForm({ entity })}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger-outline"
                      size="sm"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => setToDelete(entity)}
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

      {meta ? (
        <Pager
          className="mt-6"
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          disabled={loading}
          onPageChange={setPage}
        />
      ) : null}

      <EntityFormModal
        open={form !== null}
        projectId={projectId}
        entity={form?.entity ?? null}
        onClose={() => setForm(null)}
        onSaved={() => {
          setForm(null);
          void refetch();
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete entity?"
        description={`"${toDelete?.name ?? ""}" will be hidden. You can restore it later; its key stays reserved in this project.`}
        confirmLabel="Delete"
        loading={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
