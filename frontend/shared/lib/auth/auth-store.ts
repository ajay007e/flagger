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

// A single stable reference for useAuth's getServerSnapshot below. Returning a
// new object literal there each call (as this previously did inline) violates
// useSyncExternalStore's requirement that a snapshot function returns the same
// reference when nothing has changed, which React reports as "The result of
// getServerSnapshot should be cached to avoid an infinite loop."
const INITIAL_STATE: AuthState = { status: "checking", user: null };

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
  return useSyncExternalStore(subscribe, getSnapshot, () => INITIAL_STATE);
}
