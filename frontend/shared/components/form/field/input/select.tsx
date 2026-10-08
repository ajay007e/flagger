"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib/utils";

import { useFieldContext } from "../field.context";
import { inputWrapperVariants } from "./input.styles";
import type { FieldSelectProps, FieldSelectWidth } from "../field.types";

const MAX_PANEL_HEIGHT = 240;
const PANEL_GAP = 4;
const VIEWPORT_MARGIN = 8;

interface PanelPosition {
  left: number;
  minWidth: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

const WIDTH_CLASSES: Record<FieldSelectWidth, string> = {
  full: "w-full",
  sm: "w-full sm:w-36",
  md: "w-full sm:w-48",
  lg: "w-full sm:w-64",
};

const FieldSelect = forwardRef<HTMLButtonElement, FieldSelectProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = "Select…",
      leftIcon,
      width = "full",
      disabled,
      id,
      className,
      onBlur,
      "aria-label": ariaLabel,
    },
    ref,
  ) => {
    const field = useFieldContext();
    const isDisabled = disabled || field?.disabled;
    const listboxId = useId();

    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLUListElement>(null);

    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [position, setPosition] = useState<PanelPosition | null>(null);

    const selectedIndex = options.findIndex((option) => option.value === value);
    const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

    function setRefs(node: HTMLButtonElement | null) {
      triggerRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }

    function move(from: number, step: 1 | -1): number {
      for (let i = from + step; i >= 0 && i < options.length; i += step) {
        if (!options[i].disabled) {
          return i;
        }
      }

      return from;
    }

    function openPanel() {
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : move(-1, 1));
      setOpen(true);
    }

    function choose(index: number) {
      const option = options[index];

      if (!option || option.disabled) {
        return;
      }

      onValueChange(option.value);
      setOpen(false);
      triggerRef.current?.focus();
    }

    useLayoutEffect(() => {
      if (!open || !triggerRef.current) {
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
      const below =
        window.innerHeight - rect.bottom - PANEL_GAP - VIEWPORT_MARGIN;
      const above = rect.top - PANEL_GAP - VIEWPORT_MARGIN;
      const openUp = below < MAX_PANEL_HEIGHT && above > below;

      setPosition({
        left: rect.left,
        minWidth: rect.width,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + PANEL_GAP }
          : { top: rect.bottom + PANEL_GAP }),
        maxHeight: Math.min(MAX_PANEL_HEIGHT, openUp ? above : below),
      });
    }, [open]);

    useEffect(() => {
      if (!open) {
        return undefined;
      }

      function handlePointerDown(event: MouseEvent) {
        const target = event.target as Node;

        if (
          triggerRef.current?.contains(target) ||
          panelRef.current?.contains(target)
        ) {
          return;
        }

        setOpen(false);
      }

      function handleScroll(event: Event) {
        if (panelRef.current?.contains(event.target as Node)) {
          return;
        }

        setOpen(false);
      }

      function handleResize() {
        setOpen(false);
      }

      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);

      return () => {
        document.removeEventListener("mousedown", handlePointerDown);
        document.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleResize);
      };
    }, [open]);

    useEffect(() => {
      if (!open || activeIndex < 0) {
        return;
      }

      document
        .getElementById(`${listboxId}-opt-${activeIndex}`)
        ?.scrollIntoView({ block: "nearest" });
    }, [open, activeIndex, listboxId]);

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
      switch (event.key) {
        case "ArrowDown":
        case "ArrowUp": {
          event.preventDefault();

          if (!open) {
            openPanel();
          } else {
            setActiveIndex((current) =>
              move(current, event.key === "ArrowDown" ? 1 : -1),
            );
          }
          break;
        }
        case "Home":
        case "End": {
          if (open) {
            event.preventDefault();
            setActiveIndex(
              event.key === "Home" ? move(-1, 1) : move(options.length, -1),
            );
          }
          break;
        }
        case "Enter":
        case " ": {
          event.preventDefault();

          if (!open) {
            openPanel();
          } else {
            choose(activeIndex);
          }
          break;
        }
        case "Escape": {
          if (open) {
            event.stopPropagation();
            setOpen(false);
          }
          break;
        }
        case "Tab": {
          setOpen(false);
          break;
        }
        default:
          break;
      }
    }

    return (
      <div className={cn("relative", WIDTH_CLASSES[width], className)}>
        <button
          ref={setRefs}
          id={id ?? field?.id}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={
            open && activeIndex >= 0
              ? `${listboxId}-opt-${activeIndex}`
              : undefined
          }
          aria-label={ariaLabel}
          aria-invalid={field?.state === "invalid"}
          aria-describedby={field?.describedBy}
          aria-required={field?.required}
          disabled={isDisabled}
          onClick={() => (open ? setOpen(false) : openPanel())}
          onKeyDown={handleKeyDown}
          onKeyUp={(event) => {
            if (event.key === " ") {
              event.preventDefault();
            }
          }}
          onBlur={onBlur}
          className={cn(
            inputWrapperVariants({
              size: field?.size,
              variant: field?.variant,
              state: field?.state,
              disabled: isDisabled,
              fullWidth: true,
            }),
            "gap-2 text-left text-foreground",
            !isDisabled && "cursor-pointer",
          )}
        >
          {leftIcon ? (
            <span className="shrink-0 text-muted" aria-hidden="true">
              {leftIcon}
            </span>
          ) : null}

          <span
            className={cn("min-w-0 flex-1 truncate", !selected && "text-muted")}
          >
            {selected ? selected.label : placeholder}
          </span>

          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        {open && position
          ? createPortal(
              <ul
                ref={panelRef}
                id={listboxId}
                role="listbox"
                aria-label={ariaLabel}
                style={{
                  position: "fixed",
                  left: position.left,
                  top: position.top,
                  bottom: position.bottom,
                  minWidth: position.minWidth,
                  maxHeight: position.maxHeight,
                }}
                className="z-[60] overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-lg"
              >
                {options.map((option, index) => (
                  <li
                    key={option.value}
                    id={`${listboxId}-opt-${index}`}
                    role="option"
                    aria-selected={index === selectedIndex}
                    aria-disabled={option.disabled || undefined}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => {
                      if (!option.disabled) {
                        setActiveIndex(index);
                      }
                    }}
                    onClick={() => choose(index)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm",
                      index === activeIndex && "bg-muted/10",
                      index === selectedIndex && "font-medium text-primary",
                      option.disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    {index === selectedIndex ? (
                      <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : null}
                  </li>
                ))}
              </ul>,
              document.body,
            )
          : null}
      </div>
    );
  },
);

FieldSelect.displayName = "Field.Select";

export default FieldSelect;
