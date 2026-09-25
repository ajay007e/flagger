import type { HTMLAttributes } from "react";

export type LoaderSize = "sm" | "md" | "lg";

export interface ComponentLoaderProps extends HTMLAttributes<HTMLDivElement> {
  size?: LoaderSize;
  /** Shown next to the spinner. When omitted, an sr-only "Loading" is used instead. */
  label?: string;
}

export interface PageLoaderProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}
