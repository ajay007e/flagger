import type { LoaderSize } from "./loader.types";

export const LOADER_SIZE_CLASSES: Record<LoaderSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-9 w-9",
};

export const DEFAULT_LOADER_SIZE: LoaderSize = "md";
