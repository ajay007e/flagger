"use client";

import { Modal } from "@/shared/components/ui/modal/modal";

import { ChangePasswordForm } from "./change-password-form";

/**
 * Non-dismissible, same as LoginModal: the app requires a new password before
 * continuing, so there's no way to cancel out of this one either.
 */
export function ChangePasswordModal({ open }: { open: boolean }) {
  return (
    <Modal
      open={open}
      dismissible={false}
      title="Set a new password"
      description="You need to choose a new password before continuing."
      size="sm"
    >
      <ChangePasswordForm />
    </Modal>
  );
}
