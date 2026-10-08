"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button, Field, FormError, Modal, toast } from "@/shared/components";
import { ERROR_CODES } from "@/shared/constants";
import { getErrorCode, getErrorMessage } from "@/shared/lib";

import { USER_TYPE_LABELS, USER_TYPES } from "../users.constants";
import { usersService } from "../users.service";
import type { CreateUserInput, User, UserCredentials } from "../users.types";
import { createUserSchema } from "../users.validator";

interface UserFormModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSaved: (created?: UserCredentials) => void;
}

export function UserFormModal({
  open,
  user,
  onClose,
  onSaved,
}: UserFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? "Edit user" : "New user"}
    >
      {open ? (
        <UserForm
          key={user?.id ?? "new"}
          user={user}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}

function UserForm({
  user,
  onClose,
  onSaved,
}: Omit<UserFormModalProps, "open">) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    control,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: user?.email ?? "",
      name: user?.name ?? "",
      type: user?.type ?? "user",
    },
  });

  async function onSubmit(values: CreateUserInput): Promise<void> {
    setFormError(null);

    try {
      if (user) {
        await usersService.update(user.id, {
          name: values.name,
          type: values.type,
        });
        toast.success("User updated");
        onSaved();
        return;
      }

      const { data: body } = await usersService.create(values);

      if (!body.success) {
        throw new Error(body.message);
      }

      onSaved(body.data);
    } catch (error) {
      const code = getErrorCode(error);

      if (code === ERROR_CODES.CONFLICT) {
        setError("email", { message: getErrorMessage(error) });
      } else if (code === ERROR_CODES.LAST_ADMIN) {
        setError("type", { message: getErrorMessage(error) });
      } else {
        setFormError(getErrorMessage(error));
      }
    }
  }

  const TYPE_OPTIONS = USER_TYPES.map((type) => ({
    value: type,
    label: USER_TYPE_LABELS[type],
  }));

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormError>{formError}</FormError>

      <Field
        label="Email"
        required
        error={errors.email?.message}
        helperText={
          user
            ? "The email can't be changed."
            : "A temporary password is generated after you create the user."
        }
      >
        <Field.Input
          type="email"
          readOnly={Boolean(user)}
          autoFocus={!user}
          disabled={isSubmitting}
          {...register("email")}
        />
      </Field>

      <Field label="Name" required error={errors.name?.message}>
        <Field.Input
          autoFocus={Boolean(user)}
          disabled={isSubmitting}
          {...register("name")}
        />
      </Field>

      <Field
        label="Type"
        required
        error={errors.type?.message}
        helperText="Admins bypass every permission check."
      >
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Field.Select
              ref={field.ref}
              options={TYPE_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isSubmitting}
            />
          )}
        />
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
          {user ? "Save changes" : "Create"}
        </Button>
      </div>
    </form>
  );
}
