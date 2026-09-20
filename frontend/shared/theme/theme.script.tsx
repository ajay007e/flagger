import { THEME_STORAGE_KEY, THEMES } from "@/shared/theme/themes";

/**
 * Runs before first paint to set data-theme on <html>, which avoids a flash
 * of the wrong theme. Falls back to the OS preference.
 */
export function ThemeScript() {
  const ids = JSON.stringify(THEMES.map((theme) => theme.id));
  const key = JSON.stringify(THEME_STORAGE_KEY);

  const script = `(function(){try{var ids=${ids};var s=localStorage.getItem(${key});var t=ids.indexOf(s)>-1?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
