"use client";

import { Boxes, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Button,
  ConfirmDialog,
  Pager,
  ResourceList,
  ResourceRow,
} from "@/shared/components";
import { useAction } from "@/shared/hooks";

import { useProjects } from "../projects.hook";
import { projectsService } from "../projects.service";
import type { Project } from "../projects.types";
import { ProjectFormModal } from "./project-form-modal";

import { PROJECTS_PAGE_SIZE } from "../projects.constants";

export function ProjectsScreen() {
  const router = useRouter();
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useProjects(
    page,
    PROJECTS_PAGE_SIZE,
    showDeleted,
  );
  const { busy, run } = useAction(refetch);

  const [form, setForm] = useState<{ project: Project | null } | null>(null);
  const [toDelete, setToDelete] = useState<Project | null>(null);

  const projects = data?.items ?? [];
  const meta = data?.meta;

  useEffect(() => {
    if (data && data.items.length === 0 && page > 1) {
      setPage(Math.max(1, data.meta.totalPages));
    }
  }, [data, page]);

  async function confirmDelete(): Promise<void> {
    if (!toDelete) return;

    await run(() => projectsService.remove(toDelete.id), "Project deleted");
    setToDelete(null);
  }

  return (
    <>
      <ResourceList
        title="Projects"
        description="Entities are managed inside their project."
        createLabel="New project"
        onCreate={() => setForm({ project: null })}
        showDeleted={showDeleted}
        onShowDeletedChange={(value) => {
          setShowDeleted(value);
          setPage(1);
        }}
        loading={loading && !data}
        error={error}
        onRetry={refetch}
        isEmpty={projects.length === 0}
        emptyText="No projects yet."
      >
        {projects.map((project) => {
          const deleted = Boolean(project.deletedAt);

          return (
            <ResourceRow
              key={project.id}
              name={project.name}
              itemKey={project.key}
              description={project.description}
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
                        () => projectsService.restore(project.id),
                        "Project restored",
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
                      leftIcon={<Boxes className="h-4 w-4" />}
                      onClick={() =>
                        router.push(`/admin/projects/${project.id}`)
                      }
                    >
                      Entities
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Pencil className="h-4 w-4" />}
                      onClick={() => setForm({ project })}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger-outline"
                      size="sm"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => setToDelete(project)}
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

      <ProjectFormModal
        open={form !== null}
        project={form?.project ?? null}
        onClose={() => setForm(null)}
        onSaved={() => {
          setForm(null);
          void refetch();
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete project?"
        description={`"${toDelete?.name ?? ""}" and its entities will be unavailable until you restore it. Its key stays reserved.`}
        confirmLabel="Delete"
        loading={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
