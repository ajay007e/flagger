"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  Badge,
  ComponentLoader,
  FormError,
  NotFoundState,
} from "@/shared/components";
import { ERROR_CODES } from "@/shared/constants";

import { useProject } from "../projects.hook";

interface ProjectDetailProps {
  projectId: number;
  children: ReactNode;
}

export function ProjectDetail({ projectId, children }: ProjectDetailProps) {
  const { project, loading, error, errorCode } = useProject(projectId);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/projects"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Projects
      </Link>

      {loading ? (
        <ComponentLoader label="Loading…" />
      ) : errorCode === ERROR_CODES.NOT_FOUND || (!error && !project) ? (
        <NotFoundState />
      ) : error ? (
        <FormError>{error}</FormError>
      ) : project ? (
        <>
          <header className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-xl font-semibold">
                {project.name}
              </h1>
              <Badge variant="outline">{project.key}</Badge>
              {project.deletedAt ? (
                <Badge variant="danger">Deleted</Badge>
              ) : null}
            </div>
            {project.description ? (
              <p className="mt-1 break-words text-sm text-muted">
                {project.description}
              </p>
            ) : null}
          </header>

          {project.deletedAt ? (
            <FormError>
              This project is deleted. Restore it from the projects list to
              manage its entities.
            </FormError>
          ) : (
            children
          )}
        </>
      ) : null}
    </div>
  );
}
