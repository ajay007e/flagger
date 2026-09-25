import type { ReactNode } from "react";

import { add, dismiss } from "./toast.store";
import type { ToastOptions, ToastVariant } from "./toast.types";

function createToastFn(variant: ToastVariant) {
  return (message: ReactNode, options?: ToastOptions): string =>
    add(variant, message, options);
}

/**
 * Global toast API. Callable from anywhere, no hook or provider needed to
 * trigger one — only <Toaster /> (mounted once, in app/layout.tsx) needs to
 * exist somewhere in the tree for it to actually render.
 *
 *   toast.success("Saved");
 *   toast.error("Something went wrong", { duration: 0 }); // stays until dismissed
 */
export const toast = {
  success: createToastFn("success"),
  error: createToastFn("error"),
  warning: createToastFn("warning"),
  info: createToastFn("info"),
  dismiss,
};
