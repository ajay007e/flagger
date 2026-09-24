import type {
  FC,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

import type FieldInput from "./input/input";
import type FieldTextarea from "./input/textarea";

export type FieldSize = "sm" | "md" | "lg";
export type FieldVariant = "outline" | "filled" | "ghost";
/** Visual/a11y state, derived from whether Field has an error or a success message. */
export type FieldState = "default" | "invalid" | "success";

/** What Field passes down to Field.Input / Field.Textarea, so they never need
 * their own id, disabled, or aria-* props set by hand. */
export interface FieldContextValue {
  id: string;
  required?: boolean;
  disabled?: boolean;
  state: FieldState;
  describedBy?: string;
  size: FieldSize;
  variant: FieldVariant;
}

export interface FieldProps {
  id?: string;
  label?: ReactNode;
  children: ReactNode;
  helperText?: ReactNode;
  /** Presence of `error` sets state to "invalid" and takes priority over `success`/`helperText`. */
  error?: ReactNode;
  /** Presence of `success` (with no `error`) sets state to "success". */
  success?: ReactNode;
  required?: boolean;
  /** Shows an "Optional" hint next to the label. Ignored when `required` is true. */
  optional?: boolean;
  disabled?: boolean;
  size?: FieldSize;
  variant?: FieldVariant;
  counter?: number;
  maxLength?: number;
  className?: string;
  labelClassName?: string;
  messageClassName?: string;
  helperClassName?: string;
}

export interface FieldInputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  /** Shows a clear (x) button once the field has content. */
  clearable?: boolean;
  onClear?: () => void;
  /** Only takes effect when type="password". */
  showPasswordToggle?: boolean;
  fullWidth?: boolean;
}

export interface FieldTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  fullWidth?: boolean;
}

export interface FieldComponent extends FC<FieldProps> {
  Input: typeof FieldInput;
  Textarea: typeof FieldTextarea;
}
