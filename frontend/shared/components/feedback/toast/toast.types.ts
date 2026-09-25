import type { ReactNode } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** Milliseconds before auto-dismiss. Pass 0 to disable auto-dismiss for this toast. */
  duration?: number;
  action?: ToastAction;
}

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: ReactNode;
  duration: number;
  action?: ToastAction;
}
