import type { ReactNode } from "react";

export interface NavbarProps {
  /** Extra items rendered on the right, before the theme switcher. */
  children?: ReactNode;
  className?: string;
}
