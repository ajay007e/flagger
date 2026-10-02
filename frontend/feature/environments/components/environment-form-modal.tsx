"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button, Field, FormError, Modal, toast } from "@/shared/components";
import { ERROR_CODES } from "@/shared/constants";
import { getErrorCode, getErrorMessage } from "@/shared/lib";

import { ENVIRONMENT_DESCRIPTION_MAX_LENGTH } from "../environments.constants";
import { environmentsService } from "../environments.service";
import type {
  CreateEnvironmentInput,
  Environment,
} from "../environments.types";
import { createEnvironmentSchema } from "../environments.validator";

interface EnvironmentFormModalProps {
  open: boolean;
  /** null = create, an environment = edit. */
  environment: Environment | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EnvironmentFormModal({
  open,
  environment,
  onClose,
  onSaved,
}: EnvironmentFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={environment ? "Edit environment" : "New environment"}
    >
      {open ? (
        <EnvironmentForm
          key={environment?.id ?? "new"}
          environment={environment}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}

function EnvironmentForm({
  environment,
  onClose,
  onSaved,
}: Omit<EnvironmentFormModalProps, "open">) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateEnvironmentInput>({
    resolver: zodResolver(createEnvironmentSchema),
    defaultValues: {
      key: environment?.key ?? "",
      name: environment?.name ?? "",
      description: environment?.description ?? "",
    },
  });

  async function onSubmit(values: CreateEnvironmentInput): Promise<void> {
    setFormError(null);

    try {
      if (environment) {
        await environmentsService.update(environment.id, {
          name: values.name,
          description: values.description,
        });
      } else {
        await environmentsService.create(values);
      }

      toast.success(
        environment ? "Environment updated" : "Environment created",
      );
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
          environment
            ? "The key can't be changed."
            : "Lowercase letters, numbers and dashes. Can't be changed later."
        }
      >
        <Field.Input
          readOnly={Boolean(environment)}
          autoFocus={!environment}
          disabled={isSubmitting}
          {...register("key")}
        />
      </Field>

      <Field label="Name" required error={errors.name?.message}>
        <Field.Input
          autoFocus={Boolean(environment)}
          disabled={isSubmitting}
          {...register("name")}
        />
      </Field>

      <Field
        label="Description"
        optional
        error={errors.description?.message}
        counter={watch("description").length}
        maxLength={ENVIRONMENT_DESCRIPTION_MAX_LENGTH}
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
          {environment ? "Save changes" : "Create"}
        </Button>
      </div>
    </form>
  );
}
