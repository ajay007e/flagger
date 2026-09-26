import type { ReactNode } from "react";

import type { ButtonVariant } from "../button/types";

export interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  /** Style of the confirm action. Defaults to "danger" (the common case:
   * confirming something destructive); pass "primary" for a neutral one. */
  confirmVariant?: ButtonVariant;
  /** Disables Cancel/Escape/backdrop-dismiss while an action is in flight,
   * same convention as a form mid-submit. */
  loading?: boolean;
}
