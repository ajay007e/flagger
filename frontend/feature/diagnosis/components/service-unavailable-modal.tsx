"use client";

import { Loader2 } from "lucide-react";

import { Modal } from "@/shared/components";

/** Non-dismissible: no close button, no Escape, no backdrop click. The gate unmounts it. */
export function ServiceUnavailableModal() {
  return (
    <Modal
      open
      dismissible={false}
      size="sm"
      title="Service unavailable"
      description="We're having trouble reaching the service. Nothing is lost; this page will recover automatically."
    >
      <div className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span role="status">Waiting for the service to come back...</span>
      </div>
    </Modal>
  );
}
