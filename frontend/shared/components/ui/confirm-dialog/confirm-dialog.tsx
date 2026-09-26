"use client";

import Button from "@/shared/components/ui/button/button";

import { Modal } from "../index";
import type { ConfirmDialogProps } from "./confirm-dialog.types";

/**
 * A Modal laid out for a yes/no confirmation: centered icon, centered
 * title/description, Cancel + confirm in the footer — rather than Modal's
 * default left-aligned header. Reused for "are you sure?" moments generally
 * (logout now; deleting a flag, a user, revoking access, later), not built
 * as a one-off for logout specifically.
 */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  icon,
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      dismissible={!loading}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-3 text-center">
        {icon ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
            {icon}
          </div>
        ) : null}

        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold">{title}</h3>

          {description ? (
            <p className="text-sm text-muted">{description}</p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
