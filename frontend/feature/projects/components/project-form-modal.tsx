"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button, Field, FormError, Modal, toast } from "@/shared/components";
import { ERROR_CODES } from "@/shared/constants";
import { getErrorCode, getErrorMessage } from "@/shared/lib";

import { PROJECT_DESCRIPTION_MAX_LENGTH } from "../projects.constants";
import { projectsService } from "../projects.service";
import type { CreateProjectInput, Project } from "../projects.types";
import { createProjectSchema } from "../projects.validator";

interface ProjectFormModalProps {
  open: boolean;
  /** null = create, a project = edit. */
  project: Project | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProjectFormModal({
  open,
  project,
  onClose,
  onSaved,
}: ProjectFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? "Edit project" : "New project"}
    >
      {open ? (
        <ProjectForm
          key={project?.id ?? "new"}
          project={project}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}

function ProjectForm({
  project,
  onClose,
  onSaved,
}: Omit<ProjectFormModalProps, "open">) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      key: project?.key ?? "",
      name: project?.name ?? "",
      description: project?.description ?? "",
    },
  });

  async function onSubmit(values: CreateProjectInput): Promise<void> {
    setFormError(null);

    try {
      if (project) {
        await projectsService.update(project.id, {
          name: values.name,
          description: values.description,
        });
      } else {
        await projectsService.create(values);
      }

      toast.success(project ? "Project updated" : "Project created");
      onSaved();
    } catch (error) {
      if (getErrorCode(error) === ERROR_CODES.CONFLICT) {
        setError("key", { message: getErrorMessage(error) });
      } else {
        setFormError(getErrorMessage(error));
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormError>{formError}</FormError>

      <Field
        label="Key"
        required
        error={errors.key?.message}
        helperText={
          project
            ? "The key can't be changed."
            : "Lowercase letters, numbers and dashes. Can't be changed later."
        }
      >
        <Field.Input
          readOnly={Boolean(project)}
          autoFocus={!project}
          disabled={isSubmitting}
          {...register("key")}
        />
      </Field>

      <Field label="Name" required error={errors.name?.message}>
        <Field.Input
          autoFocus={Boolean(project)}
          disabled={isSubmitting}
          {...register("name")}
        />
      </Field>

      <Field
        label="Description"
        optional
        error={errors.description?.message}
        counter={watch("description").length}
        maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
      >
        <Field.Textarea disabled={isSubmitting} {...register("description")} />
      </Field>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {project ? "Save changes" : "Create"}
        </Button>
      </div>
    </form>
  );
}
