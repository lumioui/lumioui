import * as React from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import { useTheme } from "../theme";
import { ease, spring, tempo, timing } from "../tokens/animation";
import { useReducedMotion } from "../hooks/useReducedMotion";

/*
 * Lumio light — the three ways light does work on a surface (DESIGN-TASTE §0b).
 *
 *  Sheen      retired — renders nothing (no light sweeps across surfaces)
 *  LightPool  the reward light: brightens on the event, then settles low
 *  LightFall  a stage lit from above in the product's hue
 *
 * All three are decoration: pointerEvents none, hidden from screen readers.
 */

const useGradientId = () => React.useId().replace(/[^a-zA-Z0-9]/g, "");

export interface SheenProps {
  /** Change this (e.g. increment) to fire one pass. 0 never fires. */
  run: number;
  /** Light colour. */
  color?: string;
  /** Peak alpha of the band. */
  strength?: number;
}

/**
 * Sheen — retired. Lumio no longer sweeps a band of light across things: a
 * pass read as a flash going over every load, commit and reward. Results now
 * show on the object itself (a check, a stamp, a fill, a LightPool that
 * brightens and settles). The component stays so existing call sites keep
 * compiling; it renders nothing. Don't add new uses.
 */
export function Sheen(_props: SheenProps) {
  return null;
}
Sheen.displayName = "Sheen";

/** After the peak the pool settles to this share of it — present, below notice. */
const POOL_REST = 0.45;

export interface LightPoolProps {
  /** Lit while true. Turning on brightens to a peak then settles; off dims out. */
  on: boolean;
  /** Light colour; defaults to the surface accent (`colors.primary`). */
  color?: string;
  /** Diameter in points. */
  size?: number;
  /** Peak alpha at the centre. */
  strength?: number;
  /** Bump (e.g. increment) while on to brighten to the peak again from
   *  wherever it is, then settle — a second event on the same object. */
  pulse?: number;
  /** Positioning, e.g. "absolute self-center -top-10". */
  className?: string;
  /** Positioning by numbers when it depends on layout. */
  style?: ViewStyle;
}

/**
 * LightPool — the reward light behind an earned object (a seal, a medal, a
 * stamped card). It exists only around the event: it is not a permanent halo.
 */
export function LightPool({ on, color, size = 260, strength = 0.42, pulse = 0, className, style: place }: LightPoolProps) {
  const { colors } = useTheme();
  const id = useGradientId();
  const lit = useSharedValue(0);
  React.useEffect(() => {
    lit.value = on
      ? withSequence(
          withTiming(1, { ...timing.slow, easing: Easing.bezier(...ease.out) }),
          withTiming(POOL_REST, { duration: tempo.roll, easing: Easing.bezier(...ease.inOut) })
        )
      : withTiming(0, timing.recede);
  }, [on, lit]);
  React.useEffect(() => {
    if (!pulse || !on) return;
    // From the current value, so a settled pool never blinks out first.
    lit.value = withSequence(
      withTiming(1, { ...timing.slow, easing: Easing.bezier(...ease.out) }),
      withTiming(POOL_REST, { duration: tempo.roll, easing: Easing.bezier(...ease.inOut) })
    );
    // Only a new pulse fires it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ opacity: lit.value }));
  const hue = color ?? colors.primary;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={className ?? "absolute"}
      style={[{ width: size, height: size }, place, style]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset={0} stopColor={hue} stopOpacity={strength} />
            <Stop offset={0.5} stopColor={hue} stopOpacity={strength * 0.35} />
            <Stop offset={1} stopColor={hue} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}
LightPool.displayName = "LightPool";

export interface LightFallProps {
  /** Light colour; defaults to the surface accent. Changing it pours the new
   *  light in over the old one (`timing.slow`) — pass the selected item's
   *  colour and the stage takes it. */
  color?: string;
  /** How far down the stage the light reaches, 0–1. */
  reach?: number;
  /** Alpha at the top edge. */
  strength?: number;
  /**
   * Stage light that follows the selection: the horizontal centre, 0–1, of a
   * pool falling from the top edge. Omit for an even wash across the width.
   * Changing it glides the pool there on `spring.glide`.
   */
  at?: number;
}

interface FallLayer {
  hue: string;
  key: number;
}

/** A spot is this share of the stage wide, so a pool over one of three or
 *  four items still spills a little onto its neighbours. */
const SPOT_SPAN = 1.1;

/**
 * LightFall — a stage lit from above: the product hue pours down from the top
 * edge and fades out. Place it first inside a stage (it fills its parent).
 *
 *   <LightFall />                                  // even wash in the accent
 *   <LightFall color={scene.hue} at={(i + 0.5) / scenes.length} />  // follows the pick
 *
 * A colour change crossfades (the old light dims while the new one pours in)
 * and a moving spot glides; reduced motion keeps the crossfade and jumps the
 * spot. Nothing loops — the light changes only when the selection does.
 */
export function LightFall({ color, reach = 0.6, strength, at }: LightFallProps) {
  const { colors, scheme } = useTheme();
  const reduce = useReducedMotion();
  const hue = color ?? colors.primary;
  const top = strength ?? (scheme === "dark" ? 0.34 : 0.22);

  // The lit colour and the one dimming behind it, resolved during render.
  const [layers, setLayers] = React.useState<FallLayer[]>([{ hue, key: 0 }]);
  let shown = layers;
  const head = layers[layers.length - 1]!;
  if (head.hue !== hue) {
    // Keep up to three dimming lights behind the new one, so a quick run of
    // picks never pops the oldest off mid-fade (each retires once it's dark).
    shown = [...layers.slice(-3), { hue, key: head.key + 1 }];
    setLayers(shown);
  }
  const retire = React.useCallback((key: number) => {
    setLayers((ls) => ls.filter((l) => l.key >= key));
  }, []);

  const [width, setWidth] = React.useState(0);
  const x = useSharedValue(at ?? 0.5);
  React.useEffect(() => {
    if (at === undefined) return;
    x.value = reduce ? at : withSpring(at, spring.glide);
  }, [at, reduce, x]);
  const spotW = width * SPOT_SPAN;
  const glide = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value * width - spotW / 2 }],
  }));

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}
      // Always measured, so a stage that gains `at` after mount has its width.
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {at === undefined ? (
        shown.map((l, i) => (
          <FallWash
            key={l.key}
            layer={l}
            first={l.key === 0}
            leaving={i < shown.length - 1}
            reach={reach}
            top={top}
            onGone={retire}
          />
        ))
      ) : width > 0 ? (
        <Animated.View style={[{ position: "absolute", top: 0, bottom: 0, left: 0, width: spotW }, glide]}>
          {shown.map((l, i) => (
            <FallWash
              key={l.key}
              layer={l}
              first={l.key === 0}
              leaving={i < shown.length - 1}
              reach={reach}
              top={top}
              spot
              onGone={retire}
            />
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const FALL_IN = { ...timing.slow, easing: Easing.bezier(...ease.out) };
const FALL_OUT = { ...timing.slow, easing: Easing.bezier(...ease.in) };

function FallWash({
  layer,
  first,
  leaving,
  reach,
  top,
  spot = false,
  onGone,
}: {
  layer: FallLayer;
  first: boolean;
  leaving: boolean;
  reach: number;
  top: number;
  spot?: boolean;
  onGone: (key: number) => void;
}) {
  const id = useGradientId();
  const on = useSharedValue(first ? 1 : 0);
  React.useEffect(() => {
    if (leaving) {
      // Retire the old light once it has dimmed (keeps only the next one).
      on.value = withTiming(0, FALL_OUT, (finished) => {
        if (finished) runOnJS(onGone)(layer.key + 1);
      });
    } else if (!first) {
      on.value = withTiming(1, FALL_IN);
    }
  }, [leaving, first, on, onGone, layer.key]);
  const style = useAnimatedStyle(() => ({ opacity: on.value }));
  return (
    <Animated.View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          {spot ? (
            // A pool hanging from the top edge. Gradient units follow the
            // rect's box, so a rect twice the reach tall gives a pool as wide
            // as the spot and exactly `reach` deep (the rest is clipped).
            <RadialGradient id={id} cx="50%" cy="0%" r="50%" fx="50%" fy="0%">
              <Stop offset={0} stopColor={layer.hue} stopOpacity={Math.min(1, top * 1.25)} />
              <Stop offset={0.45} stopColor={layer.hue} stopOpacity={top * 0.45} />
              <Stop offset={1} stopColor={layer.hue} stopOpacity={0} />
            </RadialGradient>
          ) : (
            <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <Stop offset={0} stopColor={layer.hue} stopOpacity={top} />
              <Stop offset={reach * 0.45} stopColor={layer.hue} stopOpacity={top * 0.4} />
              <Stop offset={reach} stopColor={layer.hue} stopOpacity={0} />
            </LinearGradient>
          )}
        </Defs>
        <Rect x="0" y="0" width="100%" height={spot ? `${reach * 200}%` : "100%"} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}
LightFall.displayName = "LightFall";
