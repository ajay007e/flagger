import type { ReactNode } from "react";

export type ModalSize = "sm" | "md" | "lg";

export interface ModalProps {
  open: boolean;
  /** Omit together with dismissible={false} to make the modal non-closable. */
  onClose?: () => void;
  /** When false: no close button, no backdrop-click close, no Escape close. */
  dismissible?: boolean;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
}
