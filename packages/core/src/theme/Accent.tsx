import * as React from "react";
import { View, useWindowDimensions, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import { vars } from "nativewind";
import { ACCENTS, darkColors, lightColors, type AccentName } from "../tokens/colors";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { pinStageScheme } from "./stage";

/** "#E2503B" → "9 71% 56%" — the `h s% l%` triplet NativeWind CSS vars expect. */
export function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Every semantic colour token as NativeWind CSS vars for one scheme — lets a
 *  fixed-scheme stage (a dark player/camera canvas inside a light-mode app)
 *  resolve bg-card / text-foreground / border-border to that scheme. */
function schemeVars(scheme: "light" | "dark") {
  const tokens = scheme === "dark" ? darkColors : lightColors;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    if (typeof value !== "string" || !value.startsWith("#")) continue;
    out[`--${key.replace(/[A-Z]|\d+/g, (c) => "-" + c.toLowerCase())}`] = hexToHsl(value);
  }
  return out;
}

/** Mix a hex toward white (amount > 0) or black (amount < 0). */
function mixHex(hex: string, amount: number): string {
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const ch = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
    return Math.round(c + (target - c) * t).toString(16).padStart(2, "0");
  };
  return `#${ch(0)}${ch(1)}${ch(2)}`;
}

/** WCAG relative luminance, 0 (black) … 1 (white). */
function luminance(hex: string): number {
  const lin = (i: number) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(1) + 0.7152 * lin(3) + 0.0722 * lin(5);
}

/** Custom hex as TEXT: pale fills (lime, amber) darken on light surfaces,
 *  every fill lifts toward white on dark ones — both to clear ~4.5:1. */
function textFor(hex: string, dark: boolean): string {
  if (dark) return mixHex(hex, 0.4);
  return luminance(hex) > 0.35 ? mixHex(hex, -0.55) : hex;
}

export interface AccentProps {
  /** A curated accent name (`"blue"`, `"orange"`…) or any `#RRGGBB` hex. */
  color: AccentName | (string & {});
  /** Text/icon colour on the accent fill. Curated accents supply their own;
   *  a custom hex gets ink or white by luminance. */
  onColor?: string;
  /** Pin every token below to one scheme — for scheme-fixed stages. */
  scheme?: "light" | "dark";
  className?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Accent — scopes the primary colour for everything below it. Re-points the
 * --primary / --primary-foreground / --primary-text / --ring CSS vars (so
 * `bg-primary`, `text-primary-text` follow) AND nests a ThemeProvider so
 * JS-side consumers (`useTheme().colors` — Switch, Checkbox, Slider, SVG
 * strokes) follow too. Outside an Accent, primary is neutral ink.
 *
 *   <Accent color="blue"><Button>Send</Button></Accent>
 */
export function Accent({ color, onColor, scheme, className, style, children }: AccentProps) {
  const { scheme: inherited } = useTheme();
  const effective = scheme ?? inherited;
  const dark = effective === "dark";
  // A curated accent can arrive by name or by its fill hex (an overlay that
  // portals out of its <Accent> re-pins with `useTheme().colors.primary`).
  const curated =
    (ACCENTS as Record<string, (typeof ACCENTS)[AccentName]>)[color] ??
    Object.values(ACCENTS).find((a) => a.fill.toLowerCase() === color.toLowerCase());
  const fill = curated ? curated.fill : color;
  // Ink on pale fills (lime, amber), white on everything else.
  const on = onColor ?? (curated ? curated.on : luminance(fill) > 0.4 ? "#0B0B0F" : "#FFFFFF");
  const text = curated ? (dark ? curated.textDark : curated.text) : textFor(fill, dark);

  // A pinned scheme that fills the screen is a stage: host chrome (status
  // bar, demo frame) must follow it, not the app theme — see ./stage.ts. A
  // pinned scheme on a smaller region (a dark card, a mini phone preview)
  // isn't the stage, so it must not flip the status bar.
  const win = useWindowDimensions();
  const [fills, setFills] = React.useState(false);
  const onLayout = scheme
    ? (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setFills(width >= win.width * 0.9 && height >= win.height * 0.6);
      }
    : undefined;
  React.useEffect(() => (scheme && fills ? pinStageScheme(scheme) : undefined), [scheme, fills]);

  const themeVars = React.useMemo(
    () =>
      vars({
        ...(scheme ? schemeVars(scheme) : {}),
        "--primary": hexToHsl(fill),
        "--primary-foreground": hexToHsl(on),
        "--primary-text": hexToHsl(text),
        "--ring": hexToHsl(fill),
      }),
    [scheme, fill, on, text]
  );
  const overrides = React.useMemo(
    () => ({ primary: fill, primaryForeground: on, primaryText: text, ring: fill }),
    [fill, on, text]
  );

  return (
    <View style={[themeVars, style]} className={className} onLayout={onLayout}>
      <ThemeProvider nested forcedScheme={effective} themeOverrides={overrides}>
        {children}
      </ThemeProvider>
    </View>
  );
}
