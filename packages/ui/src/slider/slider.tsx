import * as React from "react";
import { forwardRef, useCallback } from "react";
import { View, type ViewProps, type GestureResponderEvent, type LayoutChangeEvent, } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { cn, ease, spring, tempo, timing, useHaptic, useReducedMotion, useTheme } from "@lumioui/core";
import { Glass } from "../glass";

// A 28pt thumb riding a 4pt track (glass lane: 24).
const THUMB = 28;
const TRACK_H = 4;
const GLASS_H = 24;

/** Thumb + fill follow — steady (ratio 1) on the flick period: the thumb
 *  trails each stepped detent by a frame and never rebounds off an end.
 *  spring.glide (settle period) lags a dragging finger, so this is local. */
const FOLLOW_OMEGA = (2 * Math.PI * 1000) / tempo.flick;
const FOLLOW = { stiffness: FOLLOW_OMEGA * FOLLOW_OMEGA, damping: 2 * FOLLOW_OMEGA, mass: 1 };
/** Grab lifts the thumb steadily (chrome — no spark); release lands it on
 *  the value with spring.bouncy's single settle. Position never bounces. */
const GRAB_SCALE = 1.1;
/** The value bubble rises this far as it ignites on grab. */
const BUBBLE_RISE = 6;
/** Bubble slot width — wide enough for a formatted price, centred on the thumb. */
const BUBBLE_W = 88;
/** A step swaps the bubble's number with this much directional travel. */
const SWAP_TRAVEL = 4;
/** Past an end, the finger has to overdrag this far before the thumb flickers. */
const OVERDRAG = 12;
/** "Can't" — the thumb kicks this far into the end it hit, then flickers home. */
const FLICKER_KICK = 4;

export interface SliderProps extends Omit<ViewProps, "className"> {
  /** Controlled value. Omit + use defaultValue for uncontrolled. */
  value?: number;
  /** Uncontrolled initial value. Default min. */
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Fires once when the finger lifts, with the settled value. */
  onSlidingComplete?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  /** Show tick marks for each step. Default false. */
  showTicks?: boolean;
  /** Glass track + thumb — a frosted lane with a glass disc. */
  glass?: boolean;
  /**
   * A value bubble that rises over the thumb while it is held and swaps its
   * number in place per step. Default false.
   */
  showValue?: boolean;
  /** Formats the bubble's number. Default `String(value)`. */
  formatValue?: (value: number) => string;
  /**
   * Overdragging past min or max flickers the thumb once into the end it hit,
   * with a warning haptic ("can't"). Default false.
   */
  flickerAtEnds?: boolean;
  /** Mirrors the thumb's position (0–1, live while dragging and gliding) so
   *  content can follow the value on the UI thread. */
  progress?: SharedValue<number>;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** A tick that switches on as the fill passes it — a dim muted dot ahead of
 *  the fill, a lit primary-foreground dot behind it. Runs on the UI thread. */
function Tick({
  progress,
  at,
  left,
  top,
  dim,
  lit,
}: {
  progress: SharedValue<number>;
  at: number;
  left: number;
  top: number;
  dim: string;
  lit: string;
}) {
  const style = useAnimatedStyle(() => {
    // A short ramp just before the tick so it brightens as the edge arrives.
    const on = Math.min(1, Math.max(0, (progress.value - at) / 0.02 + 1));
    return {
      opacity: 0.45 + 0.55 * on,
      backgroundColor: interpolateColor(on, [0, 1], [dim, lit]),
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", width: 2, height: 2, borderRadius: 1, left, top }, style]}
    />
  );
}

/**
 * Slider — drag or tap the 44pt row to set a stepped value.
 * - White thumb with a soft shadow over an accent fill
 * - The fill is light: the whole fill brightens while the thumb is held,
 *   and tick marks switch on as the fill passes them
 * - Thumb lifts while held and lands with a little life on release;
 *   position follows on a steady spring that never rebounds off an end
 * - Selection haptic on each step crossing
 * - Optional value bubble (`showValue`) and end flicker (`flickerAtEnds`)
 *
 * 60fps: the touch writes the shared value directly; the thumb follows the
 * stepped detent on the FOLLOW spring with no React round trip. React state and onValueChange fire only
 * when the stepped value actually changes. The fill moves by transform inside
 * a clipped track rather than animating width.
 */
export const Slider = forwardRef<React.ElementRef<typeof View>, SliderProps>(
  function Slider(
    {
      value: controlledValue,
      defaultValue,
      onValueChange,
      onSlidingComplete,
      min = 0,
      max = 100,
      step = 1,
      disabled,
      className,
      showTicks = false,
      glass = false,
      showValue = false,
      formatValue,
      flickerAtEnds = false,
      progress: progressOut,
      ...props
    },
    ref
  ) {
    const haptics = useHaptic();
    const { colors } = useTheme();
    const reducedMotion = useReducedMotion();
    const [internal, setInternal] = React.useState(defaultValue ?? min);
    // Resolve during render, never in a passive effect.
    const value = controlledValue ?? internal;
    const span = max - min || 1;
    const trackWidth = useSharedValue(0);
    // Plain-state mirror of the track width — ticks position during render.
    const [trackW, setTrackW] = React.useState(0);
    const progress = useSharedValue((value - min) / span);
    const thumbScale = useSharedValue(1);
    // Held light — kept under reduced motion (it is brightness, not travel).
    const held = useSharedValue(0);
    // Hand the live position to content that follows the value (UI thread).
    useAnimatedReaction(
      () => progress.value,
      (v) => {
        if (progressOut) progressOut.value = v;
      },
      [progressOut]
    );
    const kick = useSharedValue(0);
    const thumbDim = useSharedValue(1);
    const swapY = useSharedValue(0);
    const swapO = useSharedValue(1);
    // One flicker per overdrag; re-armed once the finger is back inside.
    const flickered = React.useRef(false);
    const prevShown = React.useRef(value);
    // Last value emitted from touch — compared instead of `value` so a fast
    // drag never re-emits a step React hasn't rendered yet.
    const lastEmitted = React.useRef(value);
    const dragging = React.useRef(false);

    // External / programmatic changes glide; while a finger is down the touch
    // handler owns the shared value and this effect stands aside.
    React.useEffect(() => {
      if (dragging.current) return;
      lastEmitted.current = value;
      const p = (value - min) / span;
      progress.value = reducedMotion ? p : withSpring(p, FOLLOW);
    }, [value, min, span, progress, reducedMotion]);

    // The bubble's number swaps in place: the incoming step ignites from 4pt
    // in the direction of travel (counting up rises from below).
    React.useEffect(() => {
      if (!showValue || value === prevShown.current) return;
      const dir = value > prevShown.current ? 1 : -1;
      prevShown.current = value;
      swapO.value = 0.5;
      swapO.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
      if (reducedMotion) return;
      swapY.value = dir * SWAP_TRAVEL;
      swapY.value = withSpring(0, spring.swap);
    }, [value, showValue, reducedMotion, swapO, swapY]);

    const snap = useCallback(
      (locationX: number) => {
        const w = trackWidth.value;
        if (w <= 0) return null;
        const ratio = clamp((locationX - THUMB / 2) / Math.max(1, w - THUMB), 0, 1);
        let next = min + ratio * span;
        if (step > 0) next = Math.round((next - min) / step) * step + min;
        return clamp(next, min, max);
      },
      [trackWidth, min, max, span, step]
    );

    const emit = useCallback(
      (next: number) => {
        if (next === lastEmitted.current) return;
        lastEmitted.current = next;
        haptics.selection();
        if (controlledValue === undefined) setInternal(next);
        onValueChange?.(next);
      },
      [controlledValue, onValueChange, haptics]
    );

    // Overdrag past an end flickers the thumb once into that end.
    const checkEnds = (locationX: number) => {
      const w = trackWidth.value;
      if (w <= 0) return;
      const x = locationX - THUMB / 2;
      const travel = Math.max(1, w - THUMB);
      const past = x < -OVERDRAG ? -1 : x > travel + OVERDRAG ? 1 : 0;
      if (past === 0) {
        if (x >= 0 && x <= travel) flickered.current = false;
        return;
      }
      if (flickered.current) return;
      flickered.current = true;
      haptics.warning();
      if (reducedMotion) {
        thumbDim.value = withSequence(withTiming(0.6, timing.instant), withTiming(1, timing.fast));
        return;
      }
      kick.value = past * FLICKER_KICK;
      kick.value = withSpring(0, spring.shake);
    };

    const onResponderGrant = (e: GestureResponderEvent) => {
      if (disabled) return;
      thumbScale.value = reducedMotion ? 1 : withSpring(GRAB_SCALE, spring.swap);
      held.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
      flickered.current = false;
      const next = snap(e.nativeEvent.locationX);
      if (next == null) return;
      // A tap glides to the touch point on the same steady follow.
      const p = (next - min) / span;
      progress.value = reducedMotion ? p : withSpring(p, FOLLOW);
      emit(next);
    };
    const onResponderMove = (e: GestureResponderEvent) => {
      if (disabled) return;
      dragging.current = true;
      if (flickerAtEnds) checkEnds(e.nativeEvent.locationX);
      const next = snap(e.nativeEvent.locationX);
      if (next == null) return;
      // The stepped position is spring-smoothed, so coarse steps glide
      // between detents instead of teleporting. Writes a shared value only —
      // no React state per move.
      const p = (next - min) / span;
      progress.value = reducedMotion ? p : withSpring(p, FOLLOW);
      emit(next);
    };
    const onResponderEnd = () => {
      if (disabled) return;
      thumbScale.value = reducedMotion ? 1 : withSpring(1, spring.bouncy);
      held.value = withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) });
      dragging.current = false;
      onSlidingComplete?.(lastEmitted.current);
    };

    const onLayout = (e: LayoutChangeEvent) => {
      trackWidth.value = e.nativeEvent.layout.width;
      setTrackW(e.nativeEvent.layout.width);
    };

    const laneH = glass ? GLASS_H : TRACK_H;

    // Full-width fill slid in from the left, ending under the thumb centre.
    const fillStyle = useAnimatedStyle(() => {
      const w = trackWidth.value;
      const end = progress.value * Math.max(0, w - THUMB) + THUMB / 2;
      // Light follows input: the whole fill brightens while held (reads on
      // every accent and in both schemes, unlike a white head on a light fill).
      return { opacity: 0.74 + 0.26 * held.value, transform: [{ translateX: end - w }] };
    });

    const thumbStyle = useAnimatedStyle(() => ({
      opacity: thumbDim.value,
      transform: [
        { translateX: progress.value * Math.max(0, trackWidth.value - THUMB) + kick.value },
        { scale: thumbScale.value },
      ],
    }));


    const bubbleStyle = useAnimatedStyle(() => ({
      opacity: held.value,
      transform: [
        { translateX: progress.value * Math.max(0, trackWidth.value - THUMB) + kick.value },
        { translateY: reducedMotion ? 0 : (1 - held.value) * BUBBLE_RISE },
      ],
    }));
    const bubbleTextStyle = useAnimatedStyle(() => ({
      opacity: swapO.value,
      transform: [{ translateY: swapY.value }],
    }));

    const ticks = React.useMemo(() => {
      if (!showTicks || step <= 0) return [];
      const count = Math.floor(span / step) + 1;
      if (count > 30) return [];
      return Array.from({ length: count }, (_, i) => min + i * step);
    }, [showTicks, min, span, step]);

    // Screen-reader stepper: adjustable elements get VoiceOver/TalkBack actions.
    const handleAccessibilityAction = (e: { nativeEvent: { actionName: string } }) => {
      if (disabled) return;
      const delta = e.nativeEvent.actionName === "decrement" ? -step : step;
      const next = clamp(value + delta, min, max);
      if (next !== value) emit(next);
    };

    const valueText = formatValue ? formatValue(value) : String(value);

    return (
      <View
        ref={ref}
        className={cn("h-11 justify-center", disabled && "opacity-50", className)}
        // The whole 44pt row is the touch surface — the 4pt track alone is
        // nearly untappable.
        onStartShouldSetResponder={() => !disabled}
        onMoveShouldSetResponder={() => !disabled}
        onResponderGrant={onResponderGrant}
        onResponderMove={onResponderMove}
        onResponderRelease={onResponderEnd}
        onResponderTerminate={onResponderEnd}
        accessibilityRole="adjustable"
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={handleAccessibilityAction}
        accessibilityValue={{ min, max, now: value, text: formatValue ? valueText : undefined }}
        accessibilityState={{ disabled }}
        // accessibilityValue/accessibilityState aren't forwarded to the DOM
        // on web — mirror them with explicit aria-* props.
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        aria-disabled={disabled ?? false}
        {...props}
      >
        <View onLayout={onLayout} className="w-full justify-center" style={{ height: THUMB }}>
          {/* Lane — clips the sliding fill to the rounded track. */}
          <View
            className="w-full overflow-hidden"
            style={{ height: laneH, borderRadius: laneH / 2 }}
          >
            {/* Unlit lane: ink at 0.16, the same "ahead of the value" dim
                content uses, so the track's end reads in both schemes. */}
            {!glass ? (
              <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.foreground, opacity: 0.16 }} />
            ) : null}
            {glass ? (
              <Glass effect="clear" className="absolute inset-0 rounded-full" pointerEvents="none" />
            ) : null}
            {/* Fill colour rides a style prop so Accent's JS theme reaches it. */}
            <Animated.View
              style={[
                { position: "absolute", left: 0, top: 0, bottom: 0, width: "100%", backgroundColor: colors.primary },
                fillStyle,
              ]}
            >
            </Animated.View>
            {ticks.map((tick, i) => (
              <Tick
                key={i}
                progress={progress}
                at={(tick - min) / span}
                left={((tick - min) / span) * Math.max(0, trackW - THUMB) + THUMB / 2 - 1 || 0}
                top={laneH / 2 - 1}
                dim={colors.mutedForeground}
                lit={colors.primaryForeground}
              />
            ))}
          </View>

          {/* Thumb — white disc with a soft contact shadow (raw black reads
              on both schemes, so intentionally not a token). Glass mode uses
              the material's own depth instead. */}
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                left: 0,
                width: THUMB,
                height: THUMB,
                borderRadius: THUMB / 2,
                ...(glass
                  ? {}
                  : {
                      backgroundColor: "#FFFFFF",
                      // A surface-coloured ring separates the thumb from a
                      // near-white fill (ink primary in dark) in both schemes.
                      borderWidth: 2,
                      borderColor: colors.card,
                      shadowColor: "#000",
                      shadowOpacity: 0.18,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 4,
                    }),
              },
              thumbStyle,
            ]}
            className={glass ? "overflow-hidden" : undefined}
          >
            {glass ? (
              <Glass effect="regular" sheen={0.6} bend={0.4} className="absolute inset-0 rounded-full" pointerEvents="none" />
            ) : null}
          </Animated.View>

          {showValue ? (
            // Value bubble — rides the thumb, ignites on grab, dims on release.
            // Hidden from screen readers: the row's accessibilityValue speaks.
            <Animated.View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                {
                  position: "absolute",
                  left: THUMB / 2 - BUBBLE_W / 2,
                  bottom: THUMB + 6,
                  width: BUBBLE_W,
                  alignItems: "center",
                },
                bubbleStyle,
              ]}
            >
              <View className="min-w-11 items-center overflow-hidden rounded-full bg-foreground px-3 py-1">
                <Animated.Text className="text-xs font-semibold tabular-nums text-background" style={bubbleTextStyle}>
                  {valueText}
                </Animated.Text>
              </View>
            </Animated.View>
          ) : null}
        </View>
      </View>
    );
  }
);

Slider.displayName = "Slider";
