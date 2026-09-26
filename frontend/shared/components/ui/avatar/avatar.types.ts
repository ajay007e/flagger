import type { HTMLAttributes } from "react";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Used only to derive the initial shown — pass the person's display name. */
  name: string;
  size?: AvatarSize;
}
