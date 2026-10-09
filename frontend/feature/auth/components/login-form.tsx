"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button, Field, FormError } from "@/shared/components";
import { getErrorMessage } from "@/shared/lib";
import { setAuthenticated } from "@/shared/lib/auth";

import { getDefaultRoute } from "../auth.constants";
import { authService } from "../auth.service";
import { loginSchema } from "../auth.validator";
import type { LoginInput } from "../auth.types";

export function LoginForm() {
  const router = useRouter();
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
        router.replace(getDefaultRoute(data.data.type));
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
