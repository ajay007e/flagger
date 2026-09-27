"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button, Field, FormError } from "@/shared/components";
import { getErrorMessage } from "@/shared/lib";
import { setAuthenticated, useAuth } from "@/shared/lib/auth";

import { authService } from "../auth.service";
import { changePasswordSchema } from "../auth.validator";
import type { ChangePasswordInput } from "../auth.types";

/**
 * Same pattern as LoginForm: a wrong current password or a server error is a
 * form-level FormError banner, never a toast; invalid input (too short, same
 * as the current password) is inline per field via zod.
 */
export function ChangePasswordForm() {
  const { user } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(input: ChangePasswordInput): Promise<void> {
    setFormError(null);

    try {
      await authService.changePassword(input);

      // The endpoint has no response body to read the updated user from;
      // patch the one field that changed onto what the store already has.
      if (user) {
        setAuthenticated({ ...user, mustChangePassword: false });
      }
    } catch (error) {
      setFormError(getErrorMessage(error));
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
        label="Current password"
        required
        error={errors.currentPassword?.message}
      >
        <Field.Input
          type="password"
          autoComplete="current-password"
          autoFocus
          showPasswordToggle
          disabled={isSubmitting}
          {...register("currentPassword")}
        />
      </Field>

      <Field label="New password" required error={errors.newPassword?.message}>
        <Field.Input
          type="password"
          autoComplete="new-password"
          showPasswordToggle
          disabled={isSubmitting}
          {...register("newPassword")}
        />
      </Field>

      <Button type="submit" fullWidth loading={isSubmitting}>
        Update password
      </Button>
    </form>
  );
}
