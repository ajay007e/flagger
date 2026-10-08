import type {
  ButtonHTMLAttributes,
  FC,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

import type FieldInput from "./input/input";
import type FieldSelect from "./input/select";
import type FieldTextarea from "./input/textarea";
import type FieldToggle from "./input/toggle";
import FieldMultiSelect from "./input/multi-select";

export type FieldSize = "sm" | "md" | "lg";
export type FieldVariant = "outline" | "filled" | "ghost";
export type FieldState = "default" | "invalid" | "success";

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
  error?: ReactNode;
  success?: ReactNode;
  required?: boolean;
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
  clearable?: boolean;
  onClear?: () => void;
  showPasswordToggle?: boolean;
  fullWidth?: boolean;
}

export interface FieldTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  fullWidth?: boolean;
}

export type FieldSelectWidth = "sm" | "md" | "lg" | "full";

export interface FieldSelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface FieldSelectProps {
  options: readonly FieldSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: ReactNode;
  leftIcon?: ReactNode;
  width?: FieldSelectWidth;
  disabled?: boolean;
  id?: string;
  className?: string;
  onBlur?: () => void;
  "aria-label"?: string;
}

export interface FieldToggleProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "children" | "type" | "role"
> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: ReactNode;
}

export interface FieldMultiSelectProps {
  options: readonly FieldSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  allLabel?: ReactNode;
  placeholder?: ReactNode;
  leftIcon?: ReactNode;
  width?: FieldSelectWidth;
  disabled?: boolean;
  id?: string;
  className?: string;
  onBlur?: () => void;
  "aria-label"?: string;
}

export interface FieldComponent extends FC<FieldProps> {
  Input: typeof FieldInput;
  Textarea: typeof FieldTextarea;
  Select: typeof FieldSelect;
  Toggle: typeof FieldToggle;
  MultiSelect: typeof FieldMultiSelect;
}
