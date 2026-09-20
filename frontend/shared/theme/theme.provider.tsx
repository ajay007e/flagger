"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_THEME_SETTING,
  THEME_STORAGE_KEY,
  isThemeSetting,
  resolveTheme,
  type ThemeId,
  type ThemeSetting,
} from "./themes";

type ThemeContextValue = {
  /** The user's choice, including "system". */
  theme: ThemeSetting;
  /** The theme actually applied to the page. */
  resolvedTheme: ThemeId;
  setTheme: (theme: ThemeSetting) => void;
  /** False until the stored preference has been read on the client. */
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeSetting {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);

    if (isThemeSetting(stored)) {
      return stored;
    }
  } catch {
    // Storage unavailable, fall back to the default.
  }

  return DEFAULT_THEME_SETTING;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeSetting>(DEFAULT_THEME_SETTING);
  const [resolvedTheme, setResolvedTheme] = useState<ThemeId>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(readStoredTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return undefined;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const resolved = resolveTheme(theme, media.matches);

      document.documentElement.setAttribute("data-theme", resolved);
      setResolvedTheme(resolved);
    };

    apply();

    if (theme !== "system") {
      return undefined;
    }

    media.addEventListener("change", apply);

    return () => media.removeEventListener("change", apply);
  }, [theme, mounted]);

  const setTheme = useCallback((next: ThemeSetting) => {
    setThemeState(next);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable, the choice just won't persist.
    }
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, mounted }),
    [theme, resolvedTheme, setTheme, mounted],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
