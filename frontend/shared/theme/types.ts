import type { SYSTEM_THEME, THEMES } from "./constants";

export type ThemeId = (typeof THEMES)[number]["id"];

/** The user's choice: a specific theme, or "system". */
export type ThemeSetting = ThemeId | typeof SYSTEM_THEME;

export type ThemeContextValue = {
  /** The user's choice, including "system". */
  theme: ThemeSetting;
  /** The theme actually applied to the page. */
  resolvedTheme: ThemeId;
  setTheme: (theme: ThemeSetting) => void;
  /** False until the stored preference has been read on the client. */
  mounted: boolean;
};
