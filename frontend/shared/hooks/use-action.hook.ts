"use client";

import { useState } from "react";

import { toast } from "@/shared/components";
import { getErrorMessage } from "@/shared/lib";

/**
 * Runs a one-off mutation (delete, restore, reorder): tracks `busy`, toasts
 * the error, optionally toasts success, then calls `afterSuccess` (a refetch).
 * Forms don't use this, they show errors inline.
 */
export function useAction(afterSuccess?: () => unknown) {
  const [busy, setBusy] = useState(false);

  async function run(
    action: () => Promise<unknown>,
    successMessage?: string,
  ): Promise<boolean> {
    setBusy(true);

    try {
      await action();

      if (successMessage) toast.success(successMessage);

      await afterSuccess?.();

      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));

      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, run };
}
