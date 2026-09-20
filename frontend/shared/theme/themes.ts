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

export type ThemeId = (typeof THEMES)[number]["id"];

/** "system" follows the OS preference (resolves to light or dark). */
export type ThemeSetting = ThemeId | "system";

export const THEME_STORAGE_KEY = "flagger-theme";

export const DEFAULT_THEME_SETTING: ThemeSetting = "system";

export function isThemeSetting(value: string | null): value is ThemeSetting {
  return value === "system" || THEMES.some((theme) => theme.id === value);
}

export function resolveTheme(
  setting: ThemeSetting,
  prefersDark: boolean,
): ThemeId {
  if (setting === "system") {
    return prefersDark ? "dark" : "light";
  }

  return setting;
}
