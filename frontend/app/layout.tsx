import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ApiStatus } from "@/features/health";
import { Footer, Navbar } from "@/shared/components";
import { APP_NAME } from "@/shared/config";
import { ThemeProvider, ThemeScript } from "@/shared/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "A lightweight feature flag service",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col bg-background text-foreground antialiased">
        <ThemeProvider>
          <Navbar>
            <ApiStatus />
          </Navbar>
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
