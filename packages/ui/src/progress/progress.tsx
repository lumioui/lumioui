import * as React from "react";
import { forwardRef } from "react";
import { Text, View, type LayoutChangeEvent, type ViewProps } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import Svg from "react-native-svg";
import {
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
import { Glass } from "../glass";

export interface ProgressProps extends ViewProps {
  /** 0–100 */
  value: number;
  className?: string;
  /** Fill bar classes. */
  indicatorClassName?: string;
  /** Unknown progress — the whole track breathes in place, slowly; nothing travels. */
  indeterminate?: boolean;
  /** Glass lane — a taller frosted pill instead of the hairline. */
  glass?: boolean;
  /** Reaching 100 becomes a moment: a light pool blooms under the bar, it
   *  holds, then the bar folds into this line with a drawn check. */
  completeLabel?: string;
  /** Fires when the bar reaches 100 and its moment has held. */
  onComplete?: () => void;
}

/** Determinate fill — timing.normal on ease.out: one glide to the new value. */
const FILL_TIMING = { duration: timing.normal.duration, easing: Easing.bezier(...ease.out) };
/** The fill rests just under full; completion brightens it to full accent. */
const FILL_REST = 0.9;

/** Indeterminate breath — one half (dim → bright) over two roll beats, in
 *  place. Opacity only, so reduced motion keeps it. */
const BREATH = { duration: tempo.roll * 2, easing: Easing.bezier(...ease.inOut) };
/** The breathing fill's low and high brightness. */
const BREATH_LOW = 0.25;
const BREATH_HIGH = 0.7;

/** Completion holds this long before folding (act → hold → resolve). */
const COMPLETE_HOLD = 700;
const CHECK_PATH = "M5 12.5l4.5 4.5L19 7.5";
const CHECK_LEN = 22;
const CHECK_DRAW = { duration: 240, easing: Easing.bezier(...ease.out) };
const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };

/** Progress — a bar where light is the material. The fill glides on the UI
 *  thread (translated, never resized). Indeterminate is the whole track
 *  breathing in place — nothing sweeps across it. Reaching 100 brightens the
 *  fill in place; with `completeLabel` a light pool blooms under the bar, it
 *  holds 700ms, and the bar folds into a "done" line with a drawn check that
 *  stays. */
export const Progress = forwardRef<React.ElementRef<typeof View>, ProgressProps>(
  function Progress(
    {
      value,
      className,
      indicatorClassName,
      indeterminate,
      glass = false,
      completeLabel,
      onComplete,
      onLayout,
      ...props
    },
    ref
  ) {
    const clamped = Math.max(0, Math.min(100, value));
    const reduceMotion = useReducedMotion();
    const haptic = useHaptic();
    const { colors } = useTheme();
    // 0..1 fill fraction. The fill is a full-width bar slid in from the
    // left by transform, never an animated width (which relayouts per frame).
    const fill = useSharedValue(clamped / 100);
    const bright = useSharedValue(clamped >= 100 ? 1 : 0);
    const trackWidth = useSharedValue(0);
    const breath = useSharedValue(BREATH_LOW);
    const first = React.useRef(true);

    React.useEffect(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      // Reduced motion: jump straight to the value — the light stays.
      fill.value = reduceMotion ? clamped / 100 : withTiming(clamped / 100, FILL_TIMING);
    }, [clamped, fill, reduceMotion]);

    // Completion — brighten in place, (pool, hold, fold).
    const [pooled, setPooled] = React.useState(false);
    const [folded, setFolded] = React.useState(false);
    const done = clamped >= 100;
    const wasDone = React.useRef(done);
    const completeRef = React.useRef(onComplete);
    completeRef.current = onComplete;
    React.useEffect(() => {
      if (done === wasDone.current) return;
      wasDone.current = done;
      if (!done || indeterminate) {
        bright.value = withTiming(0, DIM);
        setPooled(false);
        setFolded(false);
        return;
      }
      const lead = timing.normal.duration;
      bright.value = withDelay(lead, withTiming(1, IGNITE));
      const timers = [
        setTimeout(() => {
          if (completeLabel) {
            setPooled(true);
            haptic.success();
          }
        }, lead),
        setTimeout(() => {
          if (completeLabel) setFolded(true);
          completeRef.current?.();
        }, lead + COMPLETE_HOLD),
      ];
      return () => timers.forEach(clearTimeout);
      // Edge-triggered on reaching / leaving 100.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [done]);

    // Indeterminate — the whole track breathes, in place.
    React.useEffect(() => {
      if (!indeterminate) {
        cancelAnimation(breath);
        return;
      }
      breath.value = BREATH_LOW;
      breath.value = withRepeat(withTiming(BREATH_HIGH, BREATH), -1, true);
      return () => cancelAnimation(breath);
    }, [indeterminate, breath]);

    const fillStyle = useAnimatedStyle(() => {
      const w = trackWidth.value;
      // Hidden only until the first layout pass measures the track.
      return {
        opacity: w > 0 ? FILL_REST + (1 - FILL_REST) * bright.value : 0,
        transform: [{ translateX: (fill.value - 1) * w }],
      };
    });
    const breathStyle = useAnimatedStyle(() => ({ opacity: breath.value }));

    // Fold — the bar's height gives way to the done line.
    const [barH, setBarH] = React.useState(0);
    const [lineH, setLineH] = React.useState(0);
    const fold = useSharedValue(0);
    const draw = useSharedValue(0);
    React.useEffect(() => {
      if (!completeLabel) return;
      if (folded) {
        fold.value = reduceMotion ? withTiming(1, timing.normal) : withSpring(1, spring.surface);
        draw.value = 0;
        draw.value = reduceMotion ? 1 : withDelay(timing.fast.duration, withTiming(1, CHECK_DRAW));
      } else {
        fold.value = withTiming(0, timing.fast);
      }
    }, [folded, completeLabel, fold, draw, reduceMotion]);
    const foldStyle = useAnimatedStyle(
      () => (barH > 0 && lineH > 0 ? { height: barH + (lineH - barH) * fold.value } : {}),
      [barH, lineH]
    );
    const barStyle = useAnimatedStyle(() => ({
      opacity: 1 - Math.min(1, fold.value * 1.6),
      transform: [{ scaleY: reduceMotion ? 1 : 1 - fold.value * 0.6 }],
    }));
    const lineStyle = useAnimatedStyle(() => ({
      opacity: Math.max(0, fold.value * 1.4 - 0.4),
    }));
    const checkProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LEN * (1 - draw.value) }));

    const track = (
      <View
        ref={ref}
        className={cn(
          glass
            ? "w-full overflow-hidden rounded-full"
            : cn("h-2 w-full overflow-hidden rounded-full bg-secondary", indeterminate && "bg-primary/15"),
          className
        )}
        style={glass ? { height: 14 } : undefined}
        onLayout={(e) => {
          trackWidth.value = e.nativeEvent.layout.width;
          setBarH(e.nativeEvent.layout.height);
          onLayout?.(e);
        }}
        accessibilityRole="progressbar"
        accessibilityLabel={folded && completeLabel ? completeLabel : undefined}
        accessibilityValue={indeterminate ? undefined : { min: 0, max: 100, now: clamped }}
        accessibilityState={indeterminate ? { busy: true } : undefined}
        // RNW drops the accessibilityValue/accessibilityState objects —
        // direct aria-* props keep web screen readers informed (switch pattern).
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-busy={indeterminate ? true : undefined}
        {...props}
      >
        {glass ? <Glass effect="clear" className="absolute inset-0 rounded-full" pointerEvents="none" /> : null}
        {indeterminate ? (
          // The whole lane, lit in the accent, breathing in place.
          <Animated.View
            pointerEvents="none"
            style={breathStyle}
            className={cn("h-full w-full rounded-full bg-primary", indicatorClassName)}
          />
        ) : (
          <Animated.View
            style={fillStyle}
            className={cn("h-full w-full overflow-hidden rounded-full bg-primary", indicatorClassName)}
          />
        )}
      </View>
    );

    if (!completeLabel) return track;

    return (
      <Animated.View style={foldStyle} className="w-full justify-center">
        <LightPool on={pooled} size={220} strength={0.3} className="absolute self-center" />
        <Animated.View style={barStyle}>{track}</Animated.View>
        {/* The done line — measured once, then shown in place of the bar. */}
        <Animated.View
          pointerEvents="none"
          style={[{ position: "absolute", top: 0, left: 0, right: 0 }, lineStyle]}
          className="flex-row items-center gap-2"
          onLayout={(e: LayoutChangeEvent) => setLineH(e.nativeEvent.layout.height)}
          accessibilityElementsHidden={!folded}
        >
          <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <AnimatedPath
                d={CHECK_PATH}
                stroke={colors.primaryForeground}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={CHECK_LEN}
                animatedProps={checkProps}
              />
            </Svg>
          </View>
          <Text className="text-[15px] font-semibold text-foreground">{completeLabel}</Text>
        </Animated.View>
      </Animated.View>
    );
  }
);
Progress.displayName = "Progress";
