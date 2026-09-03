"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Wraps next-themes with our token convention: attribute is `data-theme`
 * (matching the [data-theme="dark"|"light"] overrides in globals.css), and
 * "system" (the default) leaves the attribute off entirely so the
 * prefers-color-scheme media query in globals.css takes over.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
