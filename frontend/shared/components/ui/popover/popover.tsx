"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/shared/lib/utils";

import type { PopoverProps } from "./popover.types";

/**
 * A trigger plus a panel. By default (mobileSidebar=true): an anchored
 * dropdown from `sm:` up, positioned relative to the trigger, and a full-
 * height sidebar sliding in from the right edge below `sm:` — a small
 * floating panel is awkward to tap accurately on a phone. Set
 * mobileSidebar={false} for a trigger that already lives inside its own
 * mobile drawer (e.g. AccountMenu, inside the app sidebar): it stays a small
 * anchored panel at every size instead of opening a second, stacked sidebar.
 * No portal, no viewport-edge detection: positioned with plain CSS relative
 * to its own wrapper. For something that must always block the whole screen
 * and stay centered regardless of where it was triggered from, use Modal.
 *
 * Every class name below is written out in full (never built by string
 * concatenation): Tailwind only picks up classes it can see literally in the
 * source, so a computed string like `sm:${x}` would compile fine but produce
 * no CSS at all.
 */
export function Popover({
  open,
  onClose,
  trigger,
  children,
  align = "start",
  side = "bottom",
  mobileSidebar = true,
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
    <div ref={containerRef} className="relative w-full inline-block">
      {trigger}

      {open ? (
        <div
          role="menu"
          className={cn(
            mobileSidebar && [
              // Mobile: a sidebar fixed to the right edge of the viewport.
              "fixed inset-y-0 right-0 z-40 w-72 max-w-[85vw] overflow-y-auto border-l border-border bg-surface p-2 shadow-xl",
              // sm and up: a small anchored dropdown next to the trigger instead.
              "sm:absolute sm:inset-y-auto sm:z-40 sm:w-56 sm:max-w-none sm:rounded-lg sm:border sm:p-1 sm:shadow-lg",
              side === "top"
                ? "sm:bottom-full sm:top-auto sm:mb-2 sm:mt-0"
                : "sm:top-full sm:bottom-auto sm:mt-2 sm:mb-0",
              align === "end"
                ? "sm:right-0 sm:left-auto"
                : "sm:left-0 sm:right-auto",
            ],
            !mobileSidebar && [
              // Always a small anchored panel, at every size.
              "absolute z-40 w-56 rounded-lg border border-border bg-surface p-1 shadow-lg",
              side === "top" ? "bottom-full mb-2" : "top-full mt-2",
              align === "end" ? "right-0" : "left-0",
            ],
            className,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
