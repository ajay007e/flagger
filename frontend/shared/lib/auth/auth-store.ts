"use client";

import { useSyncExternalStore } from "react";

import type { AuthReason, AuthState, SessionUser } from "./auth.types";

let state: AuthState = { status: "checking", user: null };
const listeners = new Set<() => void>();

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

export function setUnauthenticated(reason?: AuthReason): void {
  if (state.status === "unauthenticated") {
    return;
  }

  state = { status: "unauthenticated", user: null, reason };
  emit();
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, getSnapshot, () => INITIAL_STATE);
}
