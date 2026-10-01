"use client";

import { Modal } from "@/shared/components/ui";

import { ChangePasswordForm } from "./change-password-form";

interface ChangePasswordModalProps {
  open: boolean;
  /** Omit together with dismissible={false} for the forced-change case,
   * which has no way to cancel out of it. */
  onClose?: () => void;
  /** false for AuthGate's forced flow (no session-recovery escape hatch);
   * true (default) for a voluntary change opened from the profile modal. */
  dismissible?: boolean;
}

export function ChangePasswordModal({
  open,
  onClose,
  dismissible = true,
}: ChangePasswordModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={dismissible}
      title="Set a new password"
      description={
        dismissible
          ? undefined
          : "You need to choose a new password before continuing."
      }
      size="sm"
    >
      <ChangePasswordForm onSuccess={onClose} />
    </Modal>
  );
}
