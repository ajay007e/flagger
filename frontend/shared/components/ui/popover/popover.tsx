"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/shared/lib/utils";

import type { PopoverProps } from "./popover.types";

/**
 * A trigger plus a panel: an anchored dropdown from `sm:` up, positioned
 * relative to the trigger, and a full-height sidebar sliding in from the
 * right edge below `sm:` — a small floating panel is awkward to tap
 * accurately on a phone, so it becomes a proper touch target there instead.
 * No portal, no viewport-edge detection: positioned with plain CSS relative
 * to its own wrapper. For something that must always block the whole screen
 * and stay centered regardless of where it was triggered from, use Modal.
 */
export function Popover({
  open,
  onClose,
  trigger,
  children,
  align = "start",
  className,
}: PopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div ref={containerRef} className="relative inline-block">
      {trigger}

      {open ? (
        <div
          role="menu"
          className={cn(
            // Mobile: a sidebar fixed to the right edge of the viewport.
            "fixed inset-y-0 right-0 z-40 w-72 max-w-[85vw] overflow-y-auto border-l border-border bg-surface p-2 shadow-xl",
            // sm and up: a small anchored dropdown next to the trigger instead.
            "sm:absolute sm:inset-y-auto sm:top-full sm:z-40 sm:mt-2 sm:w-56 sm:max-w-none sm:rounded-lg sm:border sm:p-1 sm:shadow-lg",
            align === "end" ? "sm:right-0" : "sm:left-0 sm:right-auto",
            className,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
