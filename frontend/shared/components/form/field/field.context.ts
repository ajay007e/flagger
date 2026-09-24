import { createContext, useContext } from "react";

import type { FieldContextValue } from "./field.types";

export const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Null when a Field.Input/Field.Textarea is used outside a <Field>. Consumers
 * fall back to sensible defaults in that case rather than throwing, since a
 * bare input without a Field wrapper is a valid (if less convenient) choice.
 */
export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}
