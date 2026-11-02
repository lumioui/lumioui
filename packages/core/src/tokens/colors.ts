/**
 * LumioUI color tokens — semantic names (background, card, primary, muted…) for mobile.
 * Each theme key maps to a HSL-ready hex. Dark/light pairs keep equal contrast.
 */

export interface ColorTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  /** Brand-coloured TEXT on surfaces (tab labels, links, tinted buttons). Deeper than `primary` in light mode so it clears AA on white. */
  primaryText: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  border: string;
  input: string;
  ring: string;
  overlay: string;
  /** Categorical series palette — charts, legends, multi-segment visuals.
   *  Pink, teal, lime, red, amber: five hues apart from each other, with no
   *  blue or purple (DESIGN-TASTE §1), taken from the tint family so series
   *  and category tiles agree. Components default to ink for the first
   *  series; reach for these when a chart encodes categories. Prefer
   *  `palette` props and `bg-chart-N` classes over raw hex. */
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  /** Category tints — icon tiles, avatars, tags, legend dots: content colour
   *  that is NOT the accent. Tuned as one family (equal visual weight, white
   *  glyphs read on all but amber/lime) and lifted slightly in dark mode.
   *  `bg-tint-orange` in className, `colors.tintOrange` in code. Use instead of
   *  raw Tailwind palette classes (`bg-orange-500`) so tiles follow the scheme. */
  tintRed: string;
  tintOrange: string;
  tintAmber: string;
  tintLime: string;
  tintGreen: string;
  tintTeal: string;
  tintSky: string;
  tintBlue: string;
  tintIndigo: string;
  tintViolet: string;
  tintPink: string;
  tintSlate: string;
}

/**
 * Neutral by default. `primary` is ink (near-black on light, near-white on
 * dark) — colour belongs to content and to the accent a product chooses, not to the
 * chrome. Give a component, demo or screen its own accent with
 * `<Accent color="#2563EB">` from @lumioui/core (see ACCENTS for a curated
 * set). Lime is the LumioUI *website* brand, not a component default.
 */
export const lightColors: ColorTokens = {
  background: "#F5F5F7",
  foreground: "#0A0A0B",
  card: "#FFFFFF",
  cardForeground: "#0A0A0B",
  popover: "#FFFFFF",
  popoverForeground: "#0A0A0B",
  primary: "#0A0A0B",
  primaryForeground: "#FFFFFF",
  primaryText: "#0A0A0B",
  secondary: "#EDEDF0",
  secondaryForeground: "#18181B",
  muted: "#EDEDF0",
  mutedForeground: "#5E5E66",
  accent: "#EDEDF0",
  accentForeground: "#18181B",
  destructive: "#DD3036",
  destructiveForeground: "#FFFFFF",
  success: "#1F8552",
  successForeground: "#FFFFFF",
  warning: "#FAAA1E",
  warningForeground: "#18181B",
  border: "#E4E4E8",
  input: "#E4E4E8",
  ring: "#0A0A0B", // focus follows primary (ink); an Accent re-points it to the accent
  overlay: "rgba(10, 10, 11, 0.45)",
  chart1: "#EC2E86",
  chart2: "#14B8A6",
  chart3: "#7CC81E",
  chart4: "#F2384B",
  chart5: "#FFAE1A",
  tintRed: "#F2384B",
  tintOrange: "#FF6B1A",
  tintAmber: "#FFAE1A",
  tintLime: "#7CC81E",
  tintGreen: "#1DB866",
  tintTeal: "#14B8A6",
  tintSky: "#1AA9F0",
  tintBlue: "#3168FF",
  tintIndigo: "#6366F1",
  tintViolet: "#8B4FF4",
  tintPink: "#EC2E86",
  tintSlate: "#6E7487",
};

export const darkColors: ColorTokens = {
  background: "#0A0A0B",
  foreground: "#F5F5F7",
  card: "#18181B",
  cardForeground: "#F5F5F7",
  popover: "#1F1F23",
  popoverForeground: "#F5F5F7",
  primary: "#F5F5F7",
  primaryForeground: "#0A0A0B",
  primaryText: "#F5F5F7",
  secondary: "#232327",
  secondaryForeground: "#F5F5F7",
  muted: "#232327",
  mutedForeground: "#A1A1AA",
  accent: "#232327",
  accentForeground: "#F5F5F7",
  // Lifted red so destructive TEXT clears 4.5:1 on dark cards (#DC2626 is 3.7:1).
  destructive: "#E5484D",
  destructiveForeground: "#FFFFFF",
  // Brighter green + ink on it: AA both as text on dark cards (5.3:1) and
  // as a fill (5.9:1). #1A7F45 text was 3.5:1 on #18181B.
  success: "#27A566",
  successForeground: "#0A0A0B",
  warning: "#F4B232",
  warningForeground: "#18181B",
  border: "#2A2A2F",
  input: "#2A2A2F",
  ring: "#F5F5F7", // focus follows primary (ink); an Accent re-points it to the accent
  overlay: "rgba(0, 0, 0, 0.6)",
  chart1: "#F25C9F",
  chart2: "#2DD4BF",
  chart3: "#9BDB3C",
  chart4: "#FF5C6B",
  chart5: "#FFC03D",
  tintRed: "#FF5C6B",
  tintOrange: "#FF8640",
  tintAmber: "#FFC03D",
  tintLime: "#9BDB3C",
  tintGreen: "#3DD68C",
  tintTeal: "#2DD4BF",
  tintSky: "#4CC2FF",
  tintBlue: "#5B8BFF",
  tintIndigo: "#8183F7",
  tintViolet: "#A47BF7",
  tintPink: "#F25C9F",
  tintSlate: "#8E93A6",
};

/** Curated accents — each hue chosen by hand, then set to the most vivid
 *  lightness that still clears AA for its `on` colour (not Tailwind defaults).
 *  2026 palette: electric, clean hues; bright fills (coral, orange, amber, lime,
 *  mint, sky) carry near-black text so they can stay vivid.
 *  `fill` is used in both schemes and clears AA (4.5:1) for
 *  `on` text; `text` is the accent as TEXT on light surfaces and `textDark`
 *  on dark ones (both ≥4.5:1). Pick one per component demo or screen flow;
 *  never mix two on one screen. */
export const ACCENTS = {
  blue: { fill: "#3168FF", on: "#FFFFFF", text: "#2F5FF0", textDark: "#7FA2FF" },
  indigo: { fill: "#695EF8", on: "#FFFFFF", text: "#5E52F2", textDark: "#A39CFB" },
  violet: { fill: "#8B4FF4", on: "#FFFFFF", text: "#7E3FEE", textDark: "#B794F9" },
  pink: { fill: "#E30C70", on: "#FFFFFF", text: "#D60A69", textDark: "#F57AB0" },
  red: { fill: "#E81127", on: "#FFFFFF", text: "#D90F24", textDark: "#FF7A85" },
  coral: { fill: "#FF5A47", on: "#0B0B12", text: "#C9301C", textDark: "#FF8A7A" },
  orange: { fill: "#FF6A1A", on: "#0B0B12", text: "#C24A00", textDark: "#FF9A5C" },
  amber: { fill: "#FFB320", on: "#0B0B12", text: "#9A6400", textDark: "#FFC34D" },
  lime: { fill: "#C6F432", on: "#0B0B12", text: "#5C8007", textDark: "#C6F432" },
  green: { fill: "#0B8649", on: "#FFFFFF", text: "#0A7D44", textDark: "#3DD68C" },
  mint: { fill: "#2DD4A0", on: "#0B0B12", text: "#0A7E5A", textDark: "#5FE3BC" },
  teal: { fill: "#07837B", on: "#FFFFFF", text: "#077A73", textDark: "#3CD6CB" },
  sky: { fill: "#2EB6FF", on: "#0B0B12", text: "#0071A8", textDark: "#6CCBFF" },
} as const;

export type AccentName = keyof typeof ACCENTS;
