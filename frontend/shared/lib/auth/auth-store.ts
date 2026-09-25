"use client";

import { useSyncExternalStore } from "react";

import type { AuthState, SessionUser } from "./auth.types";

/**
 * Plain module-level store (the mutators below don't need React), so
 * setUnauthenticated() can be called from the axios response interceptor
 * (../api.ts), which runs outside any component — the same pattern used by
 * the toast store.
 */

let state: AuthState = { status: "checking", user: null };
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function getSnapshot(): AuthState {
  return state;
}

export function setChecking(): void {
  state = { status: "checking", user: null };
  emit();
}

export function setAuthenticated(user: SessionUser): void {
  state = { status: "authenticated", user };
  emit();
}

export function setUnauthenticated(): void {
  // Several in-flight requests can fail with 401 at once; only emit on the
  // actual transition so that doesn't cause repeated re-renders.
  if (state.status === "unauthenticated") {
    return;
  }

  state = { status: "unauthenticated", user: null };
  emit();
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, getSnapshot, () => ({
    status: "checking",
    user: null,
  }));
}
