import * as React from "react";
import { View, type ViewProps } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { cn, useReducedMotion, useTheme } from "@lumioui/core";

/** Ambient backdrop behind glass demos — a quiet app surface drawn
 *  in Views (a few list rows), so the demoed component is unmistakably the
 *  subject while the glass still has texture to refract. Neutral greys
 *  only: chrome carries no accent, and the glass should never pick up a
 *  brand tint from its backdrop. `seed` keeps a stable tone per demo so
 *  neighbouring tiles vary instead of flattening into one grey mass.
 *
 *  Static by default. `drift` opts into a very slow ken-burns pan for
 *  stages where the content behind the glass would otherwise read frozen;
 *  it is reduced-motion gated. Prefer a real photo or a scrolling list
 *  over this backdrop whenever the demo has one. */

type Palette = { ink: string; card: string; line: string; soft: string };

const DARK: Palette = {
  ink: "#0A0A0B",
  card: "#1F1F23",
  line: "#3F3F46",
  soft: "#2C2C31",
};
/* A second dark world — a touch cooler, so neighbouring dark tiles vary. */
const DARK_COOL: Palette = {
  ink: "#0C0E12",
  card: "#1C2028",
  line: "#3A4150",
  soft: "#2A303B",
};
const LIGHT: Palette = {
  ink: "#E6E6EA",
  card: "#FFFFFF",
  line: "#C9C9D0",
  soft: "#DADADF",
};

function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function Surface({ p }: { p: Palette }) {
  return (
    <View className="flex-1 gap-3 p-8">
      <View className="mt-1 gap-2">
        <View className="h-2 w-14 rounded-full" style={{ backgroundColor: p.soft }} />
        <View className="h-4 w-28 rounded" style={{ backgroundColor: p.line }} />
      </View>
      {[0, 1, 2].map((r) => (
        <View key={r} className="flex-row items-center gap-3 rounded-2xl p-3" style={{ backgroundColor: p.card }}>
          <View className="h-8 w-8 rounded-full" style={{ backgroundColor: p.soft }} />
          <View className="flex-1 gap-2">
            <View className="h-2 rounded-full" style={{ backgroundColor: p.line, width: `${70 - r * 12}%` }} />
            <View className="h-2 w-1/3 rounded-full" style={{ backgroundColor: p.soft }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/* The world follows the app scheme so theme-coloured content on the glass
   always has contrast: dark text on light paper in light mode, light text
   on near-black in dark mode. Demos with hard-coded white copy pass
   tone="dark" to stay on a dark world in either scheme. */
const LIGHT_PALETTES = [LIGHT, LIGHT, DARK];
const DARK_PALETTES = [DARK, DARK_COOL];

// One slow ~24s pan — ambient texture should stay subconscious; a fast
// drift would pull focus from the component under the glass.
const DRIFT_MS = 24000;

export function Ambient({
  seed = "glass",
  tone = "auto",
  drift = false,
  className,
  ...props
}: ViewProps & {
  seed?: string;
  tone?: "auto" | "dark";
  /** Slow ken-burns pan behind the glass. Off by default. */
  drift?: boolean;
}) {
  const { dark } = useTheme();
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  React.useEffect(() => {
    if (!drift || reduce) {
      cancelAnimation(t);
      t.value = 0;
      return;
    }
    t.value = withRepeat(
      withTiming(1, { duration: DRIFT_MS, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    return () => cancelAnimation(t);
  }, [drift, reduce, t]);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: 1.02 + t.value * 0.04 }, { translateX: t.value * -8 }],
  }));

  const set = tone === "dark" || dark ? DARK_PALETTES : LIGHT_PALETTES;
  const p = set[(hash(seed) >> 8) % set.length] ?? DARK;
  return (
    <View className={cn("absolute inset-0", className)} style={{ backgroundColor: p.ink }} {...props}>
      <Animated.View className="absolute -inset-4" style={anim}>
        <Surface p={p} />
      </Animated.View>
    </View>
  );
}
