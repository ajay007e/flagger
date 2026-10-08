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
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib/utils";

import { useFieldContext } from "../field.context";
import { inputWrapperVariants } from "./input.styles";
import type { FieldMultiSelectProps, FieldSelectWidth } from "../field.types";

const MAX_PANEL_HEIGHT = 280;
const PANEL_GAP = 4;
const VIEWPORT_MARGIN = 8;

const WIDTH_CLASSES: Record<FieldSelectWidth, string> = {
  full: "w-full",
  sm: "w-full sm:w-36",
  md: "w-full sm:w-48",
  lg: "w-full sm:w-64",
};

interface PanelPosition {
  left: number;
  minWidth: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

interface ListItem {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  isAll?: boolean;
}

const FieldMultiSelect = forwardRef<HTMLButtonElement, FieldMultiSelectProps>(
  (
    {
      options,
      value,
      onValueChange,
      allLabel,
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

    const items: ListItem[] = allLabel
      ? [{ value: "", label: allLabel, isAll: true }, ...options]
      : [...options];
    const selectedOptions = options.filter((option) =>
      value.includes(option.value),
    );

    let display: ReactNode;

    if (value.length === 0) {
      display = allLabel ?? placeholder;
    } else if (value.length === 1 && selectedOptions.length === 1) {
      display = selectedOptions[0]?.label;
    } else {
      display = `${value.length} selected`;
    }

    const muted = value.length === 0 && !allLabel;

    function isChecked(item: ListItem): boolean {
      return item.isAll ? value.length === 0 : value.includes(item.value);
    }

    function setRefs(node: HTMLButtonElement | null) {
      triggerRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }

    function move(from: number, step: 1 | -1): number {
      for (let i = from + step; i >= 0 && i < items.length; i += step) {
        if (!items[i]?.disabled) {
          return i;
        }
      }

      return from;
    }

    function openPanel() {
      setActiveIndex(move(-1, 1));
      setOpen(true);
    }

    function toggle(index: number) {
      const item = items[index];

      if (!item || item.disabled) {
        return;
      }

      if (item.isAll) {
        onValueChange([]);
        return;
      }

      const next = value.includes(item.value)
        ? value.filter((entry) => entry !== item.value)
        : [...value, item.value];

      onValueChange(
        options
          .filter((option) => next.includes(option.value))
          .map((option) => option.value),
      );
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
              event.key === "Home" ? move(-1, 1) : move(items.length, -1),
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
            toggle(activeIndex);
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
            className={cn("min-w-0 flex-1 truncate", muted && "text-muted")}
          >
            {display}
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
                aria-multiselectable="true"
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
                {items.map((item, index) => {
                  const checked = isChecked(item);

                  return (
                    <li
                      key={item.isAll ? "__all" : item.value}
                      id={`${listboxId}-opt-${index}`}
                      role="option"
                      aria-selected={checked}
                      aria-disabled={item.disabled || undefined}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => {
                        if (!item.disabled) {
                          setActiveIndex(index);
                        }
                      }}
                      onClick={() => toggle(index)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm",
                        index === activeIndex && "bg-muted/10",
                        item.isAll && "font-medium",
                        item.disabled && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border",
                        )}
                      >
                        {checked ? <Check className="h-3 w-3" /> : null}
                      </span>
                      <span className="min-w-0 truncate">{item.label}</span>
                    </li>
                  );
                })}
              </ul>,
              document.body,
            )
          : null}
      </div>
    );
  },
);

FieldMultiSelect.displayName = "Field.MultiSelect";

export default FieldMultiSelect;
