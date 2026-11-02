import { Platform } from "react-native";

export const fontFamily = {
  sans: Platform.select({ ios: "System", android: "Roboto", default: "System" }),
  // On the web the bare "monospace" generic falls back to a typewriter face,
  // so name the system UI mono stack first.
  mono: Platform.select({ ios: "Menlo", android: "monospace", default: 'ui-monospace, "SF Mono", Menlo, Consolas, "Roboto Mono", monospace' }),
} as const;

/** Lumio type scale — sizes that read well on both iOS and Android. */
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
} as const;

export const lineHeight = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 28,
  "2xl": 32,
  "3xl": 38,
  "4xl": 44,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;
