import type { ReactNode } from "react";

export type PopoverAlign = "start" | "end";

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  trigger: ReactNode;
  children: ReactNode;
  /** Which side the desktop dropdown aligns to, relative to the trigger.
   * Has no effect on mobile, where the panel is always a right-hand sidebar. */
  align?: PopoverAlign;
  className?: string;
}
