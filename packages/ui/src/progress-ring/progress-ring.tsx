import * as React from "react";
import { forwardRef } from "react";
import { Text, View, type ViewProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  withRepeat,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle, G } from "react-native-svg";
import {
  cn,
  ease,
  spring,
  tempo,
  timing,
  useHaptic,
  useReducedMotion,
  useTheme,
  AnimatedCircle,
  AnimatedPath,
  LightPool,
  type ColorTokens,
} from "@lumioui/core";

/**
 * ProgressRing — circular progress whose arc head is the light source.
 *   <ProgressRing value={72} />
 *   <ProgressRing value={pct} size={188} strokeWidth={16} onClosed={…}><Text>412</Text></ProgressRing>
 *   <ProgressRing indeterminate label="Syncing" />
 *
 * The arc glides to its value with a bright point at the head. Closing the
 * ring is a reward moment (act, hold, resolve): when the arc lands on 100%
 * the head ignites, the track brightens, a pool of the arc's light blooms
 * behind the ring and the centre figure swaps in place to a drawn check.
 * The check holds, then the figure returns with a "Closed" caption and
 * `onClosed` fires; the ring stays full and lit. Indeterminate is a comet —
 * a short arc with a fading tail lapping the track.
 * Expo Go compatible (react-native-svg only). Reduced motion snaps the arc,
 * keeps the light, drops the spark and travel, and swaps the comet's lap
 * for a calm opacity pulse.
 */

/** Determinate fill — same glide as linear Progress: timing.normal, ease.out. */
const FILL_MS = timing.normal.duration;
const FILL_TIMING = { duration: FILL_MS, easing: Easing.bezier(...ease.out) };

/** Comet lap — a roll and a drift (1.1s), the same cadence as the
 *  pull-to-refresh rotor, constant linear rotation. */
const LAP = { duration: tempo.roll + tempo.drift, easing: Easing.linear };
/** Reduced-motion stand-in for the lap — two rolls of calm breathing, no travel. */
const PULSE_CYCLE = { duration: tempo.roll * 2, easing: Easing.bezier(...ease.inOut) };
/** Length of the comet as a share of the track. It is drawn once and only
 *  the wrapping view rotates: animating strokeDashoffset forever would
 *  re-rasterise the path every frame, a rotate stays on the compositor. */
const COMET_ARC = 0.3;
/** The tail is drawn as this many steps, each brighter toward the head. */
const COMET_STEPS = 6;

/** Act, hold, resolve — the drawn check holds this long before the figure
 *  returns (a drift and a snap ≈ 690ms, inside the 600–800ms hold band). */
const HOLD_MS = tempo.drift + tempo.snap;
/** The check draws on in one even stroke. */
const CHECK_DRAW = { duration: timing.normal.duration, easing: Easing.bezier(...ease.out) };
const IGNITE = { ...timing.fast, easing: Easing.bezier(...ease.out) };
const DIM = { ...timing.recede, easing: Easing.bezier(...ease.in) };
/** Head-light spark when the ring closes — one small overshoot, then home. */
const HEAD_SPARK = 1.06;

/** Track alpha at rest and once the ring has closed. */
const TRACK_REST = 0.15;
const TRACK_LIT = 0.3;
/** The head's light core — present while filling, full when closed. */
const HEAD_REST = 0.6;
const HEAD_LIT = 0.95;
/** Light colour of the head core. Light, not ink: always white. */
const LIGHT = "#FFFFFF";

type Phase = "open" | "closing" | "closed";

export interface ProgressRingProps extends Omit<ViewProps, "children"> {
  /** 0–100. Ignored while `indeterminate` is set. */
  value?: number;
  /** Square size in px. Default 96. */
  size?: number;
  /** Ring stroke width in px. Default 8. */
  strokeWidth?: number;
  /** Theme color token for the arc. Default "primary". */
  color?: keyof ColorTokens;
  /** Unknown progress — renders a lapping comet instead of the fill. */
  indeterminate?: boolean;
  /** Run the indeterminate lap. false pauses the loop (off-screen, idle). Default true. */
  active?: boolean;
  /** Accessible label. Default "Progress, N%" (or "Loading" when indeterminate). */
  label?: string;
  /** Play the close moment (light, check, hold) when the value reaches 100. Default true. */
  celebrate?: boolean;
  /** Caption under the centre figure once closed. null hides it. Default "Closed". */
  closedLabel?: string | null;
  /** Success haptic when the ring closes. Default true. */
  haptics?: boolean;
  /** Fires after the close has held — resolve captions and actions here. */
  onClosed?: () => void;
  /** Center slot — label, icon, or any content rendered inside the ring. */
  children?: React.ReactNode;
  className?: string;
}

export const ProgressRing = forwardRef<React.ElementRef<typeof View>, ProgressRingProps>(
  function ProgressRing(
    {
      value = 0,
      size = 96,
      strokeWidth = 8,
      color = "primary",
      indeterminate = false,
      active = true,
      label,
      celebrate = true,
      closedLabel = "Closed",
      haptics = true,
      onClosed,
      children,
      className,
      ...props
    },
    ref
  ) {
    const { colors } = useTheme();
    const reduceMotion = useReducedMotion();
    const haptic = useHaptic(haptics);
    const clamped = Math.max(0, Math.min(100, value));
    const arcColor = colors[color];
    const full = !indeterminate && clamped >= 100;

    const c = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const target = indeterminate ? 0 : clamped / 100;

    // Close state is resolved during render: reaching 100 starts the close,
    // leaving it reopens. Mounting full shows the closed ring, no event.
    const [phase, setPhase] = React.useState<Phase>(full ? "closed" : "open");
    const [wasFull, setWasFull] = React.useState(full);
    const [pool, setPool] = React.useState(false);
    if (full !== wasFull) {
      setWasFull(full);
      setPhase(full ? (celebrate ? "closing" : "closed") : "open");
      if (!full) setPool(false);
    }

    /** 0 → empty, 1 → full circle drawn. */
    const fill = useSharedValue(target);
    /** Rotor angle for the comet. */
    const spin = useSharedValue(0);
    /** Reduced-motion pulse opacity. */
    const pulse = useSharedValue(1);
    /** 0 → resting light, 1 → closed and lit. */
    const glow = useSharedValue(full ? 1 : 0);
    const head = useSharedValue(1);
    const figure = useSharedValue(1);
    const figureScale = useSharedValue(1);
    const checkOn = useSharedValue(0);
    const checkDraw = useSharedValue(0);

    const latest = React.useRef({ haptic, onClosed });
    latest.current = { haptic, onClosed };

    React.useEffect(() => {
      fill.value = reduceMotion ? target : withTiming(target, FILL_TIMING);
    }, [target, fill, reduceMotion]);

    // Comet lap (or its reduced-motion pulse).
    React.useEffect(() => {
      if (!indeterminate) {
        cancelAnimation(spin);
        cancelAnimation(pulse);
        spin.value = 0;
        pulse.value = 1;
        return;
      }
      if (reduceMotion) {
        spin.value = 0;
        pulse.value = withRepeat(withTiming(0.45, PULSE_CYCLE), -1, true);
        return () => cancelAnimation(pulse);
      }
      if (!active) {
        // Paused (off-screen / idle): hold the comet where it is.
        cancelAnimation(spin);
        return;
      }
      spin.value = 0;
      spin.value = withRepeat(withTiming(360, LAP), -1, false);
      return () => cancelAnimation(spin);
    }, [indeterminate, reduceMotion, active, spin, pulse]);

    // The close: light lands with the arc, the check holds, the figure returns.
    React.useEffect(() => {
      if (phase !== "closing") return;
      const ignite = setTimeout(() => {
        latest.current.haptic.success();
        setPool(true);
      }, FILL_MS);
      const resolve = setTimeout(() => {
        setPhase("closed");
        latest.current.onClosed?.();
      }, FILL_MS + CHECK_DRAW.duration + HOLD_MS);
      return () => {
        clearTimeout(ignite);
        clearTimeout(resolve);
      };
    }, [phase]);

    React.useEffect(() => {
      if (phase === "closing") {
        glow.value = withDelay(FILL_MS, withTiming(1, timing.normal));
        head.value = reduceMotion
          ? 1
          : withDelay(FILL_MS, withSequence(withSpring(HEAD_SPARK, spring.pop), withSpring(1, spring.swap)));
        figure.value = withDelay(FILL_MS, withTiming(0, DIM));
        checkOn.value = withDelay(FILL_MS, withTiming(1, IGNITE));
        checkDraw.value = 0;
        checkDraw.value = reduceMotion ? 1 : withDelay(FILL_MS, withTiming(1, CHECK_DRAW));
        return;
      }
      // Leaving the check dims it — it is never un-drawn.
      const fromCheck = checkOn.value > 0;
      checkOn.value = withTiming(0, DIM);
      figure.value = withTiming(1, IGNITE);
      if (fromCheck && !reduceMotion) {
        figureScale.value = 0.96;
        figureScale.value = withSpring(1, spring.swap);
      }
      glow.value = withTiming(phase === "closed" ? 1 : 0, timing.normal);
    }, [phase, reduceMotion, glow, head, figure, figureScale, checkOn, checkDraw]);

    const arcProps = useAnimatedProps(() => ({
      // dasharray "arc gap" — a single arc segment whose head sweeps clockwise.
      strokeDashoffset: circumference * (1 - fill.value),
    }));
    const trackProps = useAnimatedProps(() => ({
      strokeOpacity: TRACK_REST + (TRACK_LIT - TRACK_REST) * glow.value,
    }));
    // Head position in the -90° rotated frame (0 = 12 o'clock).
    const headHaloProps = useAnimatedProps(() => {
      const a = fill.value * 2 * Math.PI;
      return {
        cx: c + radius * Math.cos(a),
        cy: c + radius * Math.sin(a),
        r: ((strokeWidth + 2) / 2) * head.value,
        opacity: fill.value > 0.02 ? 1 : 0,
      };
    });
    const headCoreProps = useAnimatedProps(() => {
      const a = fill.value * 2 * Math.PI;
      return {
        cx: c + radius * Math.cos(a),
        cy: c + radius * Math.sin(a),
        r: Math.max(1, strokeWidth / 4) * head.value,
        opacity: fill.value > 0.02 ? HEAD_REST + (HEAD_LIT - HEAD_REST) * glow.value : 0,
      };
    });

    const spinStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${spin.value}deg` }],
      opacity: pulse.value,
    }));
    const figureStyle = useAnimatedStyle(() => ({
      opacity: figure.value,
      transform: [{ scale: figureScale.value }],
    }));

    // Drawn check, centred, about a third of the ring.
    const k = size * 0.32;
    const x0 = c - k / 2;
    const y0 = c - k / 2;
    const checkD = `M${x0 + k * 0.12} ${y0 + k * 0.54} L${x0 + k * 0.4} ${y0 + k * 0.8} L${x0 + k * 0.9} ${y0 + k * 0.22}`;
    const checkLen = k * (Math.hypot(0.28, 0.26) + Math.hypot(0.5, 0.58));
    const checkProps = useAnimatedProps(() => ({
      strokeDashoffset: checkLen * (1 - checkDraw.value),
      opacity: checkOn.value,
    }));

    const comet = Array.from({ length: COMET_STEPS }, (_, i) => {
      const seg = (circumference * COMET_ARC) / COMET_STEPS;
      const isHead = i === COMET_STEPS - 1;
      return (
        <Circle
          key={i}
          cx={c}
          cy={c}
          r={radius}
          stroke={arcColor}
          strokeOpacity={(i + 1) / COMET_STEPS}
          strokeWidth={strokeWidth}
          strokeLinecap={isHead ? "round" : "butt"}
          fill="none"
          strokeDasharray={`${isHead ? seg * 0.6 : seg + 0.5} ${circumference}`}
          strokeDashoffset={-seg * i}
        />
      );
    });

    const showCaption = phase === "closed" && closedLabel != null && closedLabel !== "";
    const poolSize = size * 1.7;
    const baseLabel = label ?? (indeterminate ? "Loading" : `Progress, ${Math.round(clamped)} percent`);

    return (
      <View
        ref={ref}
        className={cn("items-center justify-center", className)}
        style={{ width: size, height: size }}
        accessibilityRole="progressbar"
        accessibilityLabel={showCaption ? `${baseLabel}, ${closedLabel}` : baseLabel}
        accessibilityValue={indeterminate ? undefined : { min: 0, max: 100, now: Math.round(clamped) }}
        accessibilityState={indeterminate ? { busy: true } : undefined}
        // accessibilityValue/accessibilityState aren't forwarded to the DOM
        // on web — mirror them with explicit aria-* like Slider does.
        aria-valuemin={indeterminate ? undefined : 0}
        aria-valuemax={indeterminate ? undefined : 100}
        aria-valuenow={indeterminate ? undefined : Math.round(clamped)}
        aria-busy={indeterminate ? true : undefined}
        {...props}
      >
        <LightPool
          on={pool && full}
          color={arcColor}
          size={poolSize}
          className="absolute"
          style={{ left: (size - poolSize) / 2, top: (size - poolSize) / 2 }}
        />
        <Animated.View style={spinStyle}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* -90° about the center puts the arc start at 12 o'clock —
             *  applied on <G> rather than the <Svg> style transform, which
             *  some react-native-svg versions ignore on the root element. */}
            <G transform={`rotate(-90 ${c} ${c})`}>
              <AnimatedCircle
                cx={c}
                cy={c}
                r={radius}
                stroke={arcColor}
                strokeWidth={strokeWidth}
                fill="none"
                animatedProps={trackProps}
              />
              {indeterminate ? (
                comet
              ) : (
                <>
                  <AnimatedCircle
                    cx={c}
                    cy={c}
                    r={radius}
                    stroke={arcColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    animatedProps={arcProps}
                  />
                  {/* The head is the light source: a slightly proud cap with a white core. */}
                  <AnimatedCircle fill={arcColor} animatedProps={headHaloProps} />
                  <AnimatedCircle fill={LIGHT} animatedProps={headCoreProps} />
                </>
              )}
            </G>
          </Svg>
        </Animated.View>
        {children ? (
          <>
            <Animated.View
              pointerEvents="none"
              className="absolute inset-0 items-center justify-center"
              style={figureStyle}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {children}
              {showCaption ? (
                <Text
                  className={cn("mt-1 text-sm font-semibold", color === "primary" && "text-primary-text")}
                  style={color === "primary" ? undefined : { color: arcColor }}
                >
                  {closedLabel}
                </Text>
              ) : null}
            </Animated.View>
            <Svg
              pointerEvents="none"
              width={size}
              height={size}
              style={{ position: "absolute", left: 0, top: 0 }}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <AnimatedPath
                d={checkD}
                stroke={arcColor}
                strokeWidth={Math.max(3, size * 0.045)}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={`${checkLen} ${checkLen}`}
                animatedProps={checkProps}
              />
            </Svg>
          </>
        ) : null}
      </View>
    );
  }
);

ProgressRing.displayName = "ProgressRing";
