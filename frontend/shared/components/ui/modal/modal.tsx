"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import Button from "@/shared/components/ui/button/button";
import { cn } from "@/shared/lib/utils";

import { modalPanelVariants } from "./modal.styles";
import type { ModalProps } from "./modal.types";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Generic modal dialog: portal, backdrop, a mobile-responsive panel (a bottom
 * sheet below `sm:`, a centered card above), a focus trap, and a background
 * scroll lock while open. Has no knowledge of auth or any specific use case —
 * a mandatory "log in to continue" modal is built by wrapping this with
 * dismissible={false} and no onClose, not by this component itself.
 */
export default function Modal({
  open,
  onClose,
  dismissible = true,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // createPortal touches document.body, which doesn't exist during SSR.
  // Only portal after the component has actually mounted in the browser.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Lock background scroll while open.
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Focus the panel on open. Trap Tab/Shift+Tab inside it while open, and
  // close on Escape, but only when dismissible.
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const panel = panelRef.current;
    panel?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (dismissible) {
          onClose?.();
        }
        return;
      }

      if (event.key !== "Tab" || !panel) {
        return;
      }

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, dismissible, onClose]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        aria-hidden="true"
        onClick={dismissible ? onClose : undefined}
        className="absolute inset-0 bg-black/50"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(modalPanelVariants({ size }), className)}
      >
        {/* Grab-handle affordance, bottom-sheet only (hidden from sm: up). Purely
            visual — reads as "this slides up from the bottom", no drag gesture. */}
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border sm:hidden" />

        {title || dismissible ? (
          <div className="flex items-start justify-between gap-4 border-b border-border p-4">
            <div className="flex flex-col gap-1">
              {title ? (
                <h2 id={titleId} className="text-base font-semibold">
                  {title}
                </h2>
              ) : null}

              {description ? (
                <p id={descriptionId} className="text-sm text-muted">
                  {description}
                </p>
              ) : null}
            </div>

            {dismissible ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close"
                className="h-7 w-7 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-border p-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
