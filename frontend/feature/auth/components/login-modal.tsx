"use client";

import { Modal } from "@/shared/components";

import { LoginForm } from "./login-form";

/**
 * Non-dismissible by design: no close button, no Escape, no backdrop-click.
 * This is a mandatory gate, not an optional dialog — see AuthGate, which
 * controls `open` and is the only thing that decides when this is shown.
 */
export function LoginModal({ open }: { open: boolean }) {
  return (
    <Modal open={open} dismissible={false} title="Log in to Flagger" size="sm">
      <LoginForm />
    </Modal>
  );
}
