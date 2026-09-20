import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/shared/theme/theme.provider";
import { ThemeScript } from "@/shared/theme/theme.script";

import "./globals.css";

export const metadata: Metadata = {
  title: "Flagger",
  description: "A lightweight feature flag service",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
