import * as React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme as useRNColorScheme, type ColorSchemeName } from "react-native";
import { colorScheme as nativewindColorScheme } from "nativewind";
import { lightColors, darkColors, type ColorTokens } from "../tokens/colors";

export interface Theme {
  colors: ColorTokens;
  dark: boolean;
  scheme: "light" | "dark";
}

export interface ThemeContextValue extends Theme {
  /** Override the system scheme. Pass "system" to follow the OS. */
  setSchemeOverride: (scheme: "system" | "light" | "dark") => void;
  schemeOverride: "system" | "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Force a scheme instead of following the system. */
  forcedScheme?: "light" | "dark";
  /** Custom color overrides, applied on top of the active scheme. */
  themeOverrides?: Partial<ColorTokens>;
  /** Inner provider (Accent, fixed-scheme stages): scopes tokens for its
   *  subtree only and never pushes its scheme into NativeWind's global
   *  colour scheme — otherwise a dark stage would flip the whole app. */
  nested?: boolean;
}

export function ThemeProvider({ children, forcedScheme, themeOverrides, nested = false }: ThemeProviderProps) {
  const systemScheme = useRNColorScheme();
  const [schemeOverride, setSchemeOverride] = useState<"system" | "light" | "dark">(
    forcedScheme ?? "system"
  );

  const value = useMemo<ThemeContextValue>(() => {
    const scheme: "light" | "dark" =
      forcedScheme ??
      (schemeOverride === "system" ? (systemScheme === "dark" ? "dark" : "light") : schemeOverride);
    const dark = scheme === "dark";
    const base = dark ? darkColors : lightColors;

    return {
      colors: { ...base, ...themeOverrides },
      dark,
      scheme,
      setSchemeOverride,
      schemeOverride,
    };
  }, [forcedScheme, schemeOverride, systemScheme, themeOverrides]);

  // Keep NativeWind's dark: variants and CSS variables in sync with the
  // scheme so `bg-background`, `dark:` classes, and useTheme().colors all
  // agree. NativeWind always gets the resolved scheme, never "system": with
  // darkMode "class" on the web, "system" left the CSS light while the OS
  // (and useTheme().colors) was dark. The effect re-runs when the OS flips,
  // so "system" still follows appearance changes.
  useEffect(() => {
    if (nested) return;
    try {
      nativewindColorScheme.set(value.scheme);
    } catch {
      // darkMode: "media" rejects manual overrides — the OS preference wins.
    }
  }, [value.scheme, nested]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Access the active theme. Throws if used outside ThemeProvider. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a LumioUI ThemeProvider");
  return ctx;
}

/** Current effective scheme without the full theme object. */
export function useColorScheme(): "light" | "dark" {
  return useTheme().scheme;
}

/** Alias so RN's native useColorScheme return type stays compatible. */
export type { ColorSchemeName };
