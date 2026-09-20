import { SYSTEM_THEME, THEMES } from "./constants";
import type { ThemeId, ThemeSetting } from "./types";

export function isThemeSetting(value: string | null): value is ThemeSetting {
  return value === SYSTEM_THEME || THEMES.some((theme) => theme.id === value);
}

export function resolveTheme(
  setting: ThemeSetting,
  prefersDark: boolean,
): ThemeId {
  if (setting === SYSTEM_THEME) {
    return prefersDark ? "dark" : "light";
  }

  return setting;
}
