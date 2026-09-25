import {
  DEFAULT_TOAST_DURATION_MS,
  MAX_VISIBLE_TOASTS,
} from "./toast.constants";
import type { Toast, ToastOptions, ToastVariant } from "./toast.types";

/**
 * Plain module-level store (no React import), so `toast.success(...)` etc.
 * (see toast.ts) can be called from anywhere — a route handler, an axios
 * interceptor, a plain utility function — not just from inside a component.
 * <Toaster /> is the only thing that subscribes to it, via
 * useSyncExternalStore (see toaster.tsx).
 */

type Listener = () => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let nextId = 0;

function emit(): void {
  listeners.forEach((listener) => listener());
}

function clearTimer(id: string): void {
  const timer = timers.get(id);

  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

/** Must return the same array reference when nothing changed — required by
 * useSyncExternalStore to avoid an infinite render loop. Only reassigned
 * inside add()/dismiss() below, so this holds. */
export function getSnapshot(): Toast[] {
  return toasts;
}

export function dismiss(id: string): void {
  clearTimer(id);

  const next = toasts.filter((toast) => toast.id !== id);

  if (next.length === toasts.length) {
    return;
  }

  toasts = next;
  emit();
}

export function add(
  variant: ToastVariant,
  message: Toast["message"],
  options?: ToastOptions,
): string {
  const id = `toast-${++nextId}`;
  const duration = options?.duration ?? DEFAULT_TOAST_DURATION_MS;

  const toast: Toast = {
    id,
    variant,
    message,
    duration,
    action: options?.action,
  };

  // Cap the visible stack: the oldest is dismissed first to make room.
  let next = toasts;

  if (next.length >= MAX_VISIBLE_TOASTS) {
    const [oldest, ...rest] = next;

    clearTimer(oldest.id);
    next = rest;
  }

  toasts = [...next, toast];
  emit();

  if (duration > 0) {
    timers.set(
      id,
      setTimeout(() => dismiss(id), duration),
    );
  }

  return id;
}
