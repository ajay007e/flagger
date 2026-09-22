# Theming

The frontend has light and dark themes and is set up so custom themes are easy to add.

## How it works

- Colors are CSS variables defined per theme in `frontend/shared/theme/themes.css`.
- The active theme is the `data-theme` attribute on `<html>`.
- `app/globals.css` maps the variables to Tailwind colors, so components use classes like `bg-background`, `text-muted`, and `border-border`.
- A small inline script (`ThemeScript`) sets the theme before the page paints, so there is no flash of the wrong theme.
- `ThemeProvider` keeps the choice in `localStorage`. The first visit follows the operating system setting.
- The icon button in the navbar (`ThemeSwitcher`) switches between light and dark.

## Color tokens

| Token                           | Use                            |
| ------------------------------- | ------------------------------ |
| `background`, `foreground`      | Page background and text       |
| `surface`                       | Cards and panels               |
| `muted`                         | Secondary text                 |
| `border`                        | Borders and dividers           |
| `primary`, `primary-foreground` | Primary buttons and links      |
| `success`, `success-foreground` | Positive states                |
| `danger`, `danger-foreground`   | Errors and destructive actions |

Always use these tokens instead of fixed colors like `bg-blue-600`, so every theme looks right.

## Adding a custom theme

1. Register it in `frontend/shared/theme/constants.ts`:

   ```ts
   export const THEMES = [
     { id: "light", label: "Light" },
     { id: "dark", label: "Dark" },
     { id: "ocean", label: "Ocean" },
   ] as const;
   ```

2. Add a block with the same variables in `frontend/shared/theme/themes.css`:

   ```css
   [data-theme="ocean"] {
     color-scheme: dark;

     --background: #0a1f2e;
     --foreground: #e0f2fe;
     --surface: #0f2a3d;
     --muted: #7dd3fc;
     --border: #164e63;
     --primary: #38bdf8;
     --primary-foreground: #0a1f2e;
     --success: #4ade80;
     --success-foreground: #0a1f2e;
     --danger: #f87171;
     --danger-foreground: #0a1f2e;
   }
   ```

3. Choose it with `setTheme("ocean")` from `useTheme()`.

## Things to know

- The navbar button only switches between light and dark. To let people pick a custom theme, build a picker that lists `THEMES` and calls `setTheme`.
- The `dark:` Tailwind variant only matches `data-theme="dark"`. A dark-looking custom theme does not trigger it unless you add its selector to the `@custom-variant dark` line in `app/globals.css`.
