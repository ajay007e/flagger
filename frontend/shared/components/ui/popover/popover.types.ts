import type { ReactNode } from "react";

export type PopoverAlign = "start" | "end";
export type PopoverSide = "top" | "bottom";

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  trigger: ReactNode;
  children: ReactNode;
  /** Which side the anchored panel aligns to, relative to the trigger. */
  align?: PopoverAlign;
  /** Which side of the trigger the anchored panel opens on. Has no effect
   * when mobileSidebar is true and the viewport is mobile-sized. */
  side?: PopoverSide;
  /** True (default): a full-height sidebar from the right edge on mobile,
   * an anchored dropdown from `sm:` up. False: always a small anchored panel,
   * at every size — for a trigger that already lives inside its own mobile
   * drawer/sidebar, where a second full-screen sidebar would stack awkwardly. */
  mobileSidebar?: boolean;
  className?: string;
}
