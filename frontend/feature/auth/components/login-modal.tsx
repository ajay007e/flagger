"use client";

import { Modal, Notice } from "@/shared/components";
import { useAuth } from "@/shared/lib/auth";

import { LoginForm } from "./login-form";

export function LoginModal({ open }: { open: boolean }) {
  const { reason } = useAuth();

  return (
    <Modal open={open} dismissible={false} title="Log in to Flagger" size="sm">
      {reason === "expired" ? (
        <Notice variant="info" className="mb-4">
          Your session expired. Please log in again.
        </Notice>
      ) : null}
      <LoginForm />
    </Modal>
  );
}
