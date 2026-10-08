"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  Button,
  ComponentLoader,
  Field,
  FormError,
  Modal,
  toast,
} from "@/shared/components";
import { ERROR_CODES } from "@/shared/constants";
import { useApiQuery } from "@/shared/hooks";
import { getErrorCode, getErrorMessage } from "@/shared/lib";

import { USER_TYPE_LABELS, USER_TYPES } from "../users.constants";
import { usersService } from "../users.service";
import type { CreateUserInput, User, UserCredentials } from "../users.types";
import { createUserSchema } from "../users.validator";
import { userAccessService } from "../user-access.service";
import type {
  AccessAssignment,
  AccessCardErrors,
  AccessDraft,
} from "../user-access.types";
import {
  applyAccessChanges,
  planAccessChanges,
  toDraft,
  validateCards,
} from "../user-access.utils";
import { UserAccessSection } from "./user-access-section";

const TYPE_OPTIONS = USER_TYPES.map((type) => ({
  value: type,
  label: USER_TYPE_LABELS[type],
}));

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
      size="xl"
      title={user ? "Edit user" : "New user"}
    >
      {open ? (
        user ? (
          <EditUserForm
            key={user.id}
            user={user}
            onClose={onClose}
            onSaved={onSaved}
          />
        ) : (
          <UserForm
            key="new"
            user={null}
            initialAssignments={[]}
            onClose={onClose}
            onSaved={onSaved}
          />
        )
      ) : null}
    </Modal>
  );
}

function EditUserForm({
  user,
  onClose,
  onSaved,
}: Pick<UserFormModalProps, "onClose" | "onSaved"> & { user: User }) {
  const request = useCallback(() => userAccessService.list(user.id), [user.id]);
  const { data, loading, error, refetch } = useApiQuery(request);

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3">
        <FormError>{error}</FormError>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return <ComponentLoader label="Loading…" />;
  }

  return (
    <UserForm
      user={user}
      initialAssignments={data}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function UserForm({
  user,
  initialAssignments,
  onClose,
  onSaved,
}: Pick<UserFormModalProps, "onClose" | "onSaved"> & {
  user: User | null;
  initialAssignments: AccessAssignment[];
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [cards, setCards] = useState<AccessDraft[]>(() =>
    initialAssignments.map(toDraft),
  );
  const [cardErrors, setCardErrors] = useState<
    Record<string, AccessCardErrors>
  >({});

  const {
    register,
    handleSubmit,
    setError,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: user?.email ?? "",
      name: user?.name ?? "",
      type: user?.type ?? "user",
    },
  });

  const withAccess = watch("type") === "user";

  function changeCards(next: AccessDraft[]) {
    setCards(next);
    setCardErrors({});
  }

  async function onSubmit(values: CreateUserInput): Promise<void> {
    setFormError(null);

    const accessEnabled = values.type === "user";
    const checked = accessEnabled ? validateCards(cards) : null;

    if (checked && !checked.valid) {
      setCardErrors(checked.errors);
      return;
    }

    try {
      let credentials: UserCredentials | undefined;
      let userId: number;

      if (user) {
        await usersService.update(user.id, {
          name: values.name,
          type: values.type,
        });
        userId = user.id;
      } else {
        const { data: body } = await usersService.create(values);

        if (!body.success) {
          throw new Error(body.message);
        }

        credentials = body.data;
        userId = body.data.id;
      }

      const failures = checked
        ? await applyAccessChanges(
            userId,
            planAccessChanges(initialAssignments, checked.items),
          )
        : [];

      if (failures.length > 0) {
        const noun = failures.length === 1 ? "change" : "changes";

        toast.error(
          `${user ? "User updated" : "User created"}, but ${failures.length} access ${noun} failed: ${failures[0] ?? ""}`,
          { duration: 0 },
        );
      } else if (user) {
        toast.success("User updated");
      }

      onSaved(credentials);
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

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormError>{formError}</FormError>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Email"
          required
          className="min-w-0"
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

        <Field
          label="Name"
          required
          className="min-w-0"
          error={errors.name?.message}
        >
          <Field.Input
            autoFocus={Boolean(user)}
            disabled={isSubmitting}
            {...register("name")}
          />
        </Field>
      </div>

      <Field
        label="Type"
        required
        error={errors.type?.message}
        helperText="Admins bypass every permission check, so they have no access assignments."
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

      {withAccess ? (
        <UserAccessSection
          cards={cards}
          errors={cardErrors}
          disabled={isSubmitting}
          onChange={changeCards}
        />
      ) : null}

      <div className="sticky bottom-0 -mx-4 -mb-4 flex justify-end gap-2 border-t border-border bg-surface p-4">
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
