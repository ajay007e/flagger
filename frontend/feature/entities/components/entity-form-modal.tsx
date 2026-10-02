"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button, Field, FormError, Modal, toast } from "@/shared/components";
import { ERROR_CODES } from "@/shared/constants";
import { getErrorCode, getErrorMessage } from "@/shared/lib";

import { ENTITY_DESCRIPTION_MAX_LENGTH } from "../entities.constants";
import { entitiesService } from "../entities.service";
import type { CreateEntityInput, Entity } from "../entities.types";
import { createEntitySchema } from "../entities.validator";

interface EntityFormModalProps {
  open: boolean;
  projectId: number;
  /** null = create, an entity = edit. */
  entity: Entity | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EntityFormModal({
  open,
  projectId,
  entity,
  onClose,
  onSaved,
}: EntityFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entity ? "Edit entity" : "New entity"}
    >
      {open ? (
        <EntityForm
          key={entity?.id ?? "new"}
          projectId={projectId}
          entity={entity}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}

function EntityForm({
  projectId,
  entity,
  onClose,
  onSaved,
}: Omit<EntityFormModalProps, "open">) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateEntityInput>({
    resolver: zodResolver(createEntitySchema),
    defaultValues: {
      key: entity?.key ?? "",
      name: entity?.name ?? "",
      description: entity?.description ?? "",
    },
  });

  async function onSubmit(values: CreateEntityInput): Promise<void> {
    setFormError(null);

    try {
      if (entity) {
        await entitiesService.update(projectId, entity.id, {
          name: values.name,
          description: values.description,
        });
      } else {
        await entitiesService.create(projectId, values);
      }

      toast.success(entity ? "Entity updated" : "Entity created");
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
          entity
            ? "The key can't be changed."
            : "Unique within this project. Can't be changed later."
        }
      >
        <Field.Input
          readOnly={Boolean(entity)}
          autoFocus={!entity}
          disabled={isSubmitting}
          {...register("key")}
        />
      </Field>

      <Field label="Name" required error={errors.name?.message}>
        <Field.Input
          autoFocus={Boolean(entity)}
          disabled={isSubmitting}
          {...register("name")}
        />
      </Field>

      <Field
        label="Description"
        optional
        error={errors.description?.message}
        counter={watch("description").length}
        maxLength={ENTITY_DESCRIPTION_MAX_LENGTH}
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
          {entity ? "Save changes" : "Create"}
        </Button>
      </div>
    </form>
  );
}
