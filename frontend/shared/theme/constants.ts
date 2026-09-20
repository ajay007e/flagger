/**
 * Registry of available themes.
 *
 * To add a custom theme:
 *  1. Add an entry here (the id must match the data-theme value in themes.css).
 *  2. Add a matching `[data-theme="<id>"]` block in shared/theme/themes.css.
 */
export const THEMES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
] as const;

/** Follows the OS preference (resolves to light or dark). */
export const SYSTEM_THEME = "system" as const;

export const DEFAULT_THEME_SETTING = SYSTEM_THEME;

export const THEME_STORAGE_KEY = "flagger-theme";
