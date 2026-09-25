"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button, Field } from "@/shared/components";
import { getErrorMessage } from "@/shared/lib";
import { setAuthenticated } from "@/shared/lib/auth";

import { authService } from "../auth.service";
import { loginSchema } from "../auth.validator";
import type { LoginInput } from "../auth.types";

/**
 * On failure, shows a form-level error banner (wrong credentials, a network
 * problem) — never a toast. Toasts are for incidental feedback; a failed
 * login is the direct, expected result of submitting this form, so the error
 * belongs on the form itself. Invalid input (bad email format, empty
 * password) is shown inline per field, via zod + react-hook-form.
 */
export function LoginForm() {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(input: LoginInput): Promise<void> {
    setFormError(null);

    try {
      const { data } = await authService.login(input);

      if (data.success) {
        setAuthenticated(data.data);
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
      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {formError}
        </p>
      ) : null}

      <Field label="Email" required error={errors.email?.message}>
        <Field.Input
          type="email"
          autoComplete="email"
          autoFocus
          disabled={isSubmitting}
          {...register("email")}
        />
      </Field>

      <Field label="Password" required error={errors.password?.message}>
        <Field.Input
          type="password"
          autoComplete="current-password"
          showPasswordToggle
          disabled={isSubmitting}
          {...register("password")}
        />
      </Field>

      <Button type="submit" fullWidth loading={isSubmitting}>
        Log in
      </Button>
    </form>
  );
}
