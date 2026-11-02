import * as React from "react";
import { forwardRef } from "react";
import { View, type ViewProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  cancelAnimation,
  Easing,
  interpolate,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import {
  AnimatedCircle,
  AnimatedPath,
  LightPool,
  cn,
  ease,
  spring,
  tempo,
  timing,
  useHaptic,
  useReducedMotion,
  useTheme,
} from "@lumioui/core";

/**
 * Loader — animated loading indicator with multiple variants.
 *   <Loader variant="spinner" size={32} />
 *   <Loader variant="dots" size={32} label="Loading data" />
 *   <Loader variant="bars" size={32} active={isFetching} />
 *   <Loader variant="lumen" size={48} />
 *   <Loader variant="ring" done={matched} onResolved={showDriver} />
 * Reduced motion keeps a calm opacity pulse and drops every transform.
 *
 * Waiting resolves on the loader itself: when `done` flips true the rotor
 * eases to a stop where it is, the open arc closes into a full ring, the
 * ring ignites with a check drawn inside and a small pool of accent light,
 * holds so the user sees it, then hands off through `onResolved`.
 *
 * 60fps: every variant is driven by ONE linear clock (0 to 1, repeating)
 * owned by the root. Dots and bars derive their phase-offset waves from it
 * in the worklet instead of running 3-4 independent loops each, and
 * `active={false}` cancels that single loop. Pause it when the loader
 * scrolls off-screen or the work it represents is idle.
 */

export type LoaderVariant = "spinner" | "dots" | "bars" | "pulse" | "metaballs" | "ring" | "lumen";

/**
 * Cycle lengths per variant at speed 1 (one full clock revolution), built
 * from tempo beats. Loops are scaled by the `speed` prop (2 = half as fast),
 * so the one-shot timing.* tokens don't apply.
 *   spinner   1100ms — the Lumio rotor lap (drift + roll)
 *   ring      1220ms — an open arc reads calmer a touch slower (2 × roll)
 *   lumen     1220ms — one breath of the whole ring, in place (a roll each way)
 *   dots      1170ms — three glow beats, one per dot
 *   bars       980ms — two drift beats; four bars want a quicker wave
 *   pulse     1560ms — four glow beats: a slow breath, not an alarm
 *   metaballs 1830ms — three roll beats; the merge needs time to read
 */
const PERIOD: Record<LoaderVariant, number> = {
  spinner: tempo.drift + tempo.roll,
  ring: tempo.roll * 2,
  lumen: tempo.roll * 2,
  dots: tempo.glow * 3,
  bars: tempo.drift * 2,
  pulse: tempo.glow * 4,
  metaballs: tempo.roll * 3,
};

/** Variants that turn — they stop on their current angle when done. */
const ROTORS: readonly LoaderVariant[] = ["spinner", "ring"];

/** Reduced motion: rotors (spinner/ring) swap rotation for a 1 → 0.45 → 1
 *  opacity breath on a fixed three-drift cycle, independent of `speed`. */
const REDUCED_ROTOR_PERIOD = tempo.drift * 3;

/** Staggers, as a fraction of one cycle: each dot lights one flick after
 *  the last; bars rise half a snap apart. */
const DOT_STAGGER = tempo.flick / PERIOD.dots;
const BAR_STAGGER = tempo.snap / 2 / PERIOD.bars;

/** Resolve (act, hold, resolve — DESIGN-TASTE §5c rule 5). The rotor coasts
 *  this share of a lap further while it eases out over timing.slow. */
const COAST = 0.14;
/** The open arc closes, then the check draws — one move beat each (~240ms). */
const CLOSE = { duration: tempo.move, easing: Easing.bezier(...ease.out) };
/** The resolved ring is held this long before `onResolved` hands off. */
const HOLD_MS = 650;
/** Ignite peak for the closed ring. */
const IGNITE_SCALE = 1.06;
/** Low point of the lumen ring's breath — dim, never gone. */
const LUMEN_LOW = 0.2;

/** Where each variant's lit arc starts (deg, 0 = 3 o'clock) and how much of the
 *  circle it already covers, so the closing ring grows out of the arc in view. */
const ARC: Record<LoaderVariant, { from: number; covered: number }> = {
  spinner: { from: -135, covered: 0.25 },
  ring: { from: -135, covered: 0.5 },
  lumen: { from: -90, covered: 0 },
  dots: { from: -90, covered: 0 },
  bars: { from: -90, covered: 0 },
  pulse: { from: -90, covered: 0 },
  metaballs: { from: -90, covered: 0 },
};

/** Wrap a clock reading with a phase offset back into 0..1. */
function phaseAt(t: number, offset: number) {
  "worklet";
  const p = (t - offset) % 1;
  return p < 0 ? p + 1 : p;
}

/** ease.inOut as a plain worklet function, for shaping the loop clock. */
const SHIFT_FN = Easing.bezierFn(...ease.inOut);

/** 0 -> 1 -> 0 over one phase, each half shaped by ease.inOut (shift), so
 *  a dot lifts, holds its light at the top, then settles and rests,
 *  instead of a constant sine bob. */
function wave(p: number) {
  "worklet";
  const tri = p < 0.5 ? p * 2 : 2 - p * 2;
  return SHIFT_FN(tri);
}

export interface LoaderProps extends ViewProps {
  /** Which animation to render. Default "spinner". */
  variant?: LoaderVariant;
  /** Base square size in px. Everything scales from this. Default 32. */
  size?: number;
  /** Cycle-length multiplier (2 is half as fast). Default 1. */
  speed?: number;
  /** Run the animation. false pauses the single shared loop (off-screen,
   *  idle) and reports not-busy to screen readers. Default true. */
  active?: boolean;
  /** Accessible label announced to screen readers. Default "Loading". */
  label?: string;
  /** Color token to use. Default "primary". */
  color?: "primary" | "foreground" | "mutedForeground" | "destructive";
  /** The wait is over. The loader resolves in place: the loop stops, the
   *  ring closes and ignites, a check draws inside, then it holds. */
  done?: boolean;
  /** Called once the resolved ring has been held (~650ms after it lands). */
  onResolved?: () => void;
  /** Accessible label once done. Default "Done". */
  doneLabel?: string;
  /** Fire the success haptic on resolve. Default true. */
  haptics?: boolean;
  className?: string;
}

export const Loader = forwardRef<React.ElementRef<typeof View>, LoaderProps>(
  function Loader(
    {
      variant = "spinner",
      size = 32,
      speed = 1,
      active = true,
      label = "Loading",
      color = "primary",
      done = false,
      onResolved,
      doneLabel = "Done",
      haptics = true,
      className,
      style,
      ...props
    },
    ref
  ) {
    const { colors } = useTheme();
    const reduce = useReducedMotion();
    const haptic = useHaptic(haptics);
    const colorValue = colors[color];
    const rotor = ROTORS.includes(variant);
    const running = active && !done;
    // Mount fade: a loader that appears mid-layout shouldn't pop in hard.
    // Opacity-only, so it is safe under reduced motion.
    const enter = useSharedValue(reduce ? 0.6 : 0);
    React.useEffect(() => {
      enter.value = withTiming(1, timing.fast);
    }, [enter]);

    // The one clock every part reads.
    const clock = useSharedValue(0);
    React.useEffect(() => {
      if (!running) {
        cancelAnimation(clock);
        // Done: the rotor coasts to a stop on its current angle.
        if (done && rotor && !reduce) {
          clock.value = withTiming(clock.value + COAST, { ...timing.slow, easing: Easing.bezier(...ease.out) });
        }
        return;
      }
      const period = reduce && rotor ? REDUCED_ROTOR_PERIOD : PERIOD[variant] * speed;
      clock.value = 0;
      clock.value = withRepeat(
        withTiming(1, { duration: period, easing: Easing.linear }),
        -1,
        false
      );
      return () => cancelAnimation(clock);
    }, [running, done, rotor, variant, speed, reduce, clock]);

    // Resolve: `close` grows the ring shut, `check` draws the mark, `lit`
    // carries the ignite scale.
    const close = useSharedValue(done ? 1 : 0);
    const check = useSharedValue(done ? 1 : 0);
    const lit = useSharedValue(1);
    const [pool, setPool] = React.useState(false);
    const resolvedRef = React.useRef(onResolved);
    resolvedRef.current = onResolved;
    // Mounted already done: show the evidence, no performance.
    const mountedDone = React.useRef(done);
    React.useEffect(() => {
      if (!done) {
        // Back to waiting: the resolved ring dims out in place.
        mountedDone.current = false;
        close.value = withTiming(0, timing.recede);
        check.value = withTiming(0, timing.recede);
        setPool(false);
        return;
      }
      if (mountedDone.current) return;
      close.value = withTiming(1, CLOSE);
      check.value = withSequence(withTiming(0, { duration: CLOSE.duration }), withTiming(1, CLOSE));
      if (!reduce) {
        lit.value = withSequence(
          withTiming(1, { duration: CLOSE.duration }),
          withTiming(IGNITE_SCALE, { ...timing.fast, easing: Easing.bezier(...ease.out) }),
          withSpring(1, spring.pop)
        );
      }
      const ignite = setTimeout(() => {
        setPool(true);
        haptic.success();
      }, CLOSE.duration);
      const handoff = setTimeout(() => resolvedRef.current?.(), CLOSE.duration * 2 + HOLD_MS);
      return () => {
        clearTimeout(ignite);
        clearTimeout(handoff);
      };
      // Fires once per flip of `done`; the shared values are stable.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [done]);

    const enterStyle = useAnimatedStyle(() => ({ opacity: enter.value, transform: [{ scale: lit.value }] }));
    // The loop's own marks dim as the closing ring takes over.
    const loopStyle = useAnimatedStyle(() => ({ opacity: 1 - close.value }));
    const part: PartProps = { size, color: colorValue, reduce: !!reduce, clock };

    return (
      <Animated.View
        ref={ref}
        style={[enterStyle, style]}
        accessibilityRole="progressbar"
        accessibilityLabel={done ? doneLabel : label}
        accessibilityState={{ busy: running }}
        // RNW drops the accessibilityState object, so aria-busy directly.
        aria-busy={running}
        className={cn("items-center justify-center", className)}
        {...props}
      >
        {done ? (
          <LightPool on={pool} color={colorValue} size={size * 2.4} strength={0.36} style={{ position: "absolute" }} />
        ) : null}
        <Animated.View style={loopStyle} className="items-center justify-center">
          {variant === "spinner" && <Spinner {...part} />}
          {variant === "dots" && <Dots {...part} />}
          {variant === "bars" && <Bars {...part} />}
          {variant === "pulse" && <Pulse {...part} />}
          {variant === "metaballs" && <Metaballs {...part} />}
          {variant === "ring" && <Ring {...part} />}
          {variant === "lumen" && <Lumen {...part} />}
        </Animated.View>
        <Resolved
          size={size}
          color={colorValue}
          variant={variant}
          rotor={rotor && !reduce}
          clock={clock}
          close={close}
          check={check}
        />
      </Animated.View>
    );
  }
);

Loader.displayName = "Loader";

interface PartProps {
  size: number;
  color: string;
  reduce: boolean;
  clock: SharedValue<number>;
}

/** Rotor style. Reduced motion: a 1 -> 0.45 opacity breath, no rotation. */
function useRotor(clock: SharedValue<number>, reduce: boolean) {
  return useAnimatedStyle(() =>
    reduce
      ? { transform: [{ rotate: "0deg" }], opacity: 1 - 0.55 * wave(clock.value) }
      : { transform: [{ rotate: `${clock.value * 360}deg` }], opacity: 1 }
  );
}

function Spinner({ size, color, reduce, clock }: PartProps) {
  const style = useRotor(clock, reduce);
  const stroke = Math.max(2, size * 0.09);
  // Track ring: theme hex + alpha suffix keeps one colour token for both
  // modes. Theme colors are 6-digit hex, so the suffix is a valid alpha.
  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          // track strokeOpacity 0.2 → "33".
          borderColor: `${color}33`,
          borderTopColor: color,
        },
        style,
      ]}
    />
  );
}

function Ring({ size, color, reduce, clock }: PartProps) {
  const style = useRotor(clock, reduce);
  const stroke = Math.max(2, size * 0.08);
  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: "transparent",
          borderTopColor: color,
          borderRightColor: color,
        },
        style,
      ]}
    />
  );
}

/** Lumen — a ring of light that breathes in place on a dim track: the
 *  whole ring brightens and dims together, nothing travels around it.
 *  Opacity only, so reduced motion keeps it as is. */
function Lumen({ size, color, clock }: PartProps) {
  const style = useAnimatedStyle(() => ({ opacity: LUMEN_LOW + (1 - LUMEN_LOW) * wave(clock.value) }));
  const stroke = Math.max(2, size * 0.09);
  const r = (size - stroke) / 2;
  const mid = size / 2;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={mid} cy={mid} r={r} stroke={color} strokeOpacity={0.16} strokeWidth={stroke} fill="none" />
      </Svg>
      <Animated.View style={[{ position: "absolute", width: size, height: size }, style]}>
        <Svg width={size} height={size}>
          <Circle cx={mid} cy={mid} r={r} stroke={color} strokeWidth={stroke} fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Dots({ size, color, reduce, clock }: PartProps) {
  const dot = size * 0.24;
  const gap = size * 0.14;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap, height: size }}>
      {[0, 1, 2].map((i) => (
        <Dot key={i} index={i} dot={dot} color={color} reduce={reduce} clock={clock} />
      ))}
    </View>
  );
}

function Dot({ index, dot, color, reduce, clock }: { index: number; dot: number; color: string; reduce: boolean; clock: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    // Phase offset per dot: the wave reads as travel, not a single blink.
    // Each dot ignites as it lifts one dot-height: opacity 0.35 → 1.
    // Reduced motion drops the lift and keeps the light (0.45 → 1).
    const w = wave(phaseAt(clock.value, index * DOT_STAGGER));
    return {
      transform: [{ translateY: reduce ? 0 : -dot * w }],
      opacity: interpolate(w, [0, 1], reduce ? [0.45, 1] : [0.35, 1]),
    };
  });
  return <Animated.View style={[{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }, style]} />;
}

function Bars({ size, color, reduce, clock }: PartProps) {
  const bar = size * 0.16;
  const gap = size * 0.1;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap, height: size }}>
      {[0, 1, 2, 3].map((i) => (
        <Bar key={i} index={i} bar={bar} height={size} color={color} reduce={reduce} clock={clock} />
      ))}
    </View>
  );
}

function Bar({ index, bar, height, color, reduce, clock }: { index: number; bar: number; height: number; color: string; reduce: boolean; clock: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    // Staggered left-to-right; scaleY instead of height keeps it off layout.
    // scaleY 0.35 → 1 grown from the floor, brightening as it rises;
    // reduced motion holds the bar and breathes opacity 0.45 → 1 instead.
    const w = wave(phaseAt(clock.value, index * BAR_STAGGER));
    return {
      transform: [{ scaleY: reduce ? 1 : interpolate(w, [0, 1], [0.35, 1]) }],
      opacity: interpolate(w, [0, 1], reduce ? [0.45, 1] : [0.7, 1]),
    };
  });
  return (
    <Animated.View
      style={[{ width: bar, height, borderRadius: bar / 2, backgroundColor: color, transformOrigin: "bottom" }, style]}
    />
  );
}

function Pulse({ size, color, reduce, clock }: PartProps) {
  const style = useAnimatedStyle(() => {
    const w = wave(clock.value);
    return {
      transform: [{ scale: reduce ? 1 : interpolate(w, [0, 1], [0.85, 1.1]) }],
      opacity: interpolate(w, [0, 1], [1, 0.4]),
    };
  });
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />;
}

/** Metaballs — kept for existing callers; new work should reach for `lumen`. */
function Metaballs({ size, color, reduce, clock }: PartProps) {
  // Two blobs drift through each other: as the gap closes each one
  // inflates and a bridge blob swells at the midpoint, so at the crossover
  // the mass reads as one fused body (no blur filter on native).
  const style1 = useAnimatedStyle(() => {
    const w = wave(clock.value);
    if (reduce) return { transform: [{ translateX: -size * 0.1 }, { scale: 1 }], opacity: 1 - 0.55 * w };
    const merge = 1 - Math.abs(1 - 2 * w);
    return { transform: [{ translateX: size * (0.4 * w - 0.2) }, { scale: 1 + merge * 0.18 }], opacity: 1 };
  });
  const style2 = useAnimatedStyle(() => {
    const w = wave(clock.value);
    if (reduce) return { transform: [{ translateX: size * 0.1 }, { scale: 1 }], opacity: 1 - 0.55 * w };
    const merge = 1 - Math.abs(1 - 2 * w);
    return { transform: [{ translateX: size * (0.2 - 0.4 * w) }, { scale: 1 + merge * 0.18 }], opacity: 1 };
  });
  const bridgeStyle = useAnimatedStyle(() => {
    if (reduce) return { transform: [{ scale: 0 }], opacity: 0 };
    const merge = 1 - Math.abs(1 - 2 * wave(clock.value));
    return { transform: [{ scale: merge }], opacity: merge };
  });

  // r = 15 in a 100 box, centres sliding 30 ↔ 70 — the blobs part with
  // a visible gap at the ends and fuse as they cross. Reduced motion
  // parks them at 40 / 60 and breathes opacity.
  const r = size * 0.15;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{ position: "absolute", width: r * 1.2, height: r * 1.2, borderRadius: r, backgroundColor: color }, bridgeStyle]} />
      <Animated.View style={[{ position: "absolute", width: r * 2, height: r * 2, borderRadius: r, backgroundColor: color }, style1]} />
      <Animated.View style={[{ position: "absolute", width: r * 2, height: r * 2, borderRadius: r, backgroundColor: color }, style2]} />
    </View>
  );
}

interface ResolvedProps {
  size: number;
  color: string;
  variant: LoaderVariant;
  rotor: boolean;
  clock: SharedValue<number>;
  close: SharedValue<number>;
  check: SharedValue<number>;
}

/** The resolved ring: grows shut out of the arc in view (following the
 *  rotor as it coasts to a stop), then a check draws inside. */
function Resolved({ size, color, variant, rotor, clock, close, check }: ResolvedProps) {
  const stroke = Math.max(2, size * 0.09);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const { from, covered } = ARC[variant];
  const mid = size / 2;
  const checkPath = `M ${size * 0.3} ${size * 0.52} L ${size * 0.44} ${size * 0.65} L ${size * 0.7} ${size * 0.37}`;
  const checkLen = size * 0.58;

  const ringWrap = useAnimatedStyle(() => ({
    opacity: close.value > 0 ? 1 : 0,
    transform: [{ rotate: `${from + (rotor ? clock.value * 360 : 0)}deg` }],
  }));
  const checkWrap = useAnimatedStyle(() => ({ opacity: close.value > 0 ? 1 : 0 }));
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - covered) * (1 - close.value),
  }));
  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: checkLen * (1 - check.value),
    strokeOpacity: check.value > 0 ? 1 : 0,
  }));

  return (
    <>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", width: size, height: size }, ringWrap]}>
        <Svg width={size} height={size}>
          <AnimatedCircle
            cx={mid}
            cy={mid}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            fill="none"
            animatedProps={ringProps}
          />
        </Svg>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", width: size, height: size }, checkWrap]}>
        <Svg width={size} height={size}>
          <AnimatedPath
            d={checkPath}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${checkLen} ${checkLen}`}
            fill="none"
            animatedProps={checkProps}
          />
        </Svg>
      </Animated.View>
    </>
  );
}
