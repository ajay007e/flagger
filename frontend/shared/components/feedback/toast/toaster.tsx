"use client";

import { useSyncExternalStore } from "react";

import { ToastItem } from "./toast-item";
import { getSnapshot, subscribe } from "./toast.store";

const EMPTY: [] = [];

/**
 * Renders the current toast stack. Mount once, in app/layout.tsx. Trigger a
 * toast from anywhere with `toast.success(...)` etc. (./toast.ts) — nothing
 * else needs to know this component exists.
 */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
