import * as React from "react";
import { forwardRef } from "react";
import { View, type ViewProps, } from "react-native";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { cn, useHaptic, usePressAnimation, useReducedMotion, AnimatedPressable, ease, spring, timing } from "@lumioui/core";
import { Icon, type IconName } from "../icon";

export interface StepperProps extends Omit<ViewProps, "className"> {
  /** Controlled value. Omit + use defaultValue for uncontrolled. */
  value?: number;
  /** Uncontrolled initial value. Default 0. */
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  /** Show the value in the center. Default true. Set false for a compact segment pair (just -/+). */
  showValue?: boolean;
  /** Press-and-hold to repeat. Default true. */
  repeat?: boolean;
  /** Light follows the value: a dim accent fill behind the count, sized to
   *  how far the value sits between `min` and `max`. At `max` the fill meets
   *  the edge, brightens and the edge lights; a further + flickers that edge.
   *  Needs finite bounds and the value pill (`showValue`). Default false. */
  meter?: boolean;
}

interface StepperButtonProps {
  /** "pill" — 36pt round tap zone inside the value pill; "segment" — one
   *  half of the compact pair (48×32, square-ish). */
  shape: "pill" | "segment";
  onPress: () => void;
  onLongPress?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
  icon: IconName;
  accessibilityLabel?: string;
  /** A refused tap — return true when the stepper shows the refusal itself
   *  (the lit edge flickers), so the icon stays still. */
  onRefused?: () => boolean;
}

/** Flicker at a bound — the icon kicks this far toward the refused
 *  direction and releases into spring.shake. */
const FLICKER_KICK = 4;
/** Press scale — the icon-button press depth from the Lumio press scale. */
const PRESS_SCALE = 0.94;
/** Icon dim at a bound — an in-place state change, so it shifts over
 *  timing.normal rather than popping. */
const BOUND_OPACITY = 0.4;
const BOUND_SHIFT = { duration: timing.normal.duration, easing: Easing.bezier(...ease.inOut) };

function StepperButton({ shape, onPress, onLongPress, onPressOut, disabled, icon, accessibilityLabel, onRefused }: StepperButtonProps) {
  const haptics = useHaptic();
  const reduceMotion = useReducedMotion();
  // Scale 0.94 + opacity 0.7 — both press feedbacks live in the animated
  // style (a Pressable function-style can't host a reanimated style).
  const press = usePressAnimation({ pressedScale: PRESS_SCALE, pressedOpacity: 0.7 });
  /** Icon flicker when the button is at a bound — a refused tap. */
  const nudgeX = useSharedValue(0);
  /** Bound dim — fades rather than snapping. Lives on the icon wrapper: an
   *  `opacity-40` class on the pressable lost to the press style's inline
   *  `opacity: 1`, so the dim never showed. */
  const dim = useSharedValue(disabled ? BOUND_OPACITY : 1);
  React.useEffect(() => {
    const target = disabled ? BOUND_OPACITY : 1;
    // Opacity is kept under reduced motion — it just lands instantly.
    dim.value = reduceMotion ? target : withTiming(target, BOUND_SHIFT);
  }, [disabled, dim, reduceMotion]);

  const handlePress = () => {
    if (disabled) {
      // At a bound (or the whole stepper is disabled) — warn + one flicker
      // instead of swallowing the tap in silence. Minus kicks left, plus right.
      haptics.warning();
      if (onRefused?.()) return;
      if (!reduceMotion) {
        nudgeX.value = icon === "minus" ? -FLICKER_KICK : FLICKER_KICK;
        nudgeX.value = withSpring(0, spring.shake);
      }
      return;
    }
    haptics.selection();
    onPress();
  };

  const handlePressIn = () => {
    // Disabled buttons flicker on release instead of dipping on press-in.
    if (!disabled) press.onPressIn();
  };

  const handlePressOut = () => {
    if (!disabled) press.onPressOut();
    onPressOut?.();
  };

  const nudgeStyle = useAnimatedStyle(() => ({
    opacity: dim.value,
    transform: [{ translateX: nudgeX.value }],
  }));

  return (
    <AnimatedPressable
      // Deliberately never disabled at the responder level — a tap on a
      // bound/disabled button must still fire so it can flicker + warn.
      // a11y still reports disabled via accessibilityState below.
      disabled={false}
      onPress={handlePress}
      onLongPress={() => {
        if (!disabled) onLongPress?.();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={press.animatedStyle}
      className={cn(
        shape === "pill" ? "h-9 w-9 rounded-full" : "h-8 w-12",
        "items-center justify-center"
      )}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled ?? false }}
      // Never disabled at the responder level (flicker feedback), so the DOM
      // needs an explicit aria-disabled — accessibilityState isn't forwarded.
      aria-disabled={disabled ?? false}
      // pill: 36 + 4/side = 44pt; segment: 32 tall + 6 top/bottom = 44pt.
      hitSlop={shape === "pill" ? { top: 4, left: 4, right: 4, bottom: 4 } : { top: 6, bottom: 6 }}
    >
      <Animated.View style={nudgeStyle}>
        <Icon name={icon} size="sm" color={disabled ? "mutedForeground" : "foreground"} />
      </Animated.View>
    </AnimatedPressable>
  );
}

/** Count swap — ≤6px of travel in the direction of the change (up counts
 *  rise, down counts sink); the exit travels half as far. */
const COUNT_LIFT = 5;
const SWAP_SCALE = 0.96;
const SWAP_IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
const SWAP_DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };

/**
 * Value readout that swaps in place on change — the outgoing count dims
 * while the new one ignites, lifting a few px in the direction of the step.
 */
function RollingNumber({ value }: { value: number }) {
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = React.useState(value);
  const [outgoing, setOutgoing] = React.useState<number | null>(null);
  const dir = useSharedValue(1);
  /** Incoming light, incoming settle, and outgoing dim run on separate
   *  clocks so the exit finishes first. */
  const light = useSharedValue(1);
  const bloom = useSharedValue(1);
  const tOut = useSharedValue(1);

  React.useEffect(() => {
    if (value === shown) return;
    dir.value = value > shown ? 1 : -1;
    setOutgoing(shown);
    setShown(value);
    light.value = 0;
    light.value = withTiming(1, SWAP_IGNITE);
    tOut.value = 0;
    tOut.value = withTiming(1, SWAP_DIM);
    if (reducedMotion) {
      // Opacity crossfade only — no travel, no scale.
      bloom.value = 1;
      return;
    }
    bloom.value = 0;
    bloom.value = withSpring(1, spring.swap);
  }, [value, shown, light, bloom, tOut, dir, reducedMotion]);

  const inStyle = useAnimatedStyle(() => ({
    opacity: light.value,
    transform: [
      { translateY: (1 - bloom.value) * COUNT_LIFT * dir.value },
      { scale: SWAP_SCALE + (1 - SWAP_SCALE) * bloom.value },
    ],
  }));

  const outStyle = useAnimatedStyle(() => ({
    opacity: 1 - tOut.value,
    transform: reducedMotion
      ? []
      : [
          { translateY: -tOut.value * COUNT_LIFT * 0.5 * dir.value },
          { scale: 1 - (1 - SWAP_SCALE) * tOut.value },
        ],
  }));

  return (
    // Own width (min 32, grows with digits) — a flex-1 readout inside a
    // hug-width pill collapses to zero and clips the number away.
    <View className="min-w-8 items-center justify-center overflow-hidden px-1" style={{ height: 24 }}>
      <Animated.Text
        className="text-center text-base font-semibold leading-tight text-foreground tabular-nums"
        style={inStyle}
      >
        {shown}
      </Animated.Text>
      {outgoing !== null ? (
        <Animated.Text
          className="absolute text-center text-base font-semibold leading-tight text-foreground tabular-nums"
          style={outStyle}
        >
          {outgoing}
        </Animated.Text>
      ) : null}
    </View>
  );
}

/** Meter fill at rest — a dim accent wash, present but below the digits. */
const METER_DIM = 0.14;
/** At max the fill brightens to this — lit, still readable under ink digits. */
const METER_LIT = 0.3;
/** The pill's one spark when the fill meets the edge. */
const METER_POP = 1.03;
/** A refused + past max dips the lit edge to this, then releases. */
const EDGE_FLICKER = 0.6;
const METER_IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
const METER_DIM_OUT = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };

/** Hold-repeat cadence: steady at first, quicker once the hold means "a lot". */
const REPEAT_DELAY = 400;
const REPEAT_SLOW = 100;
const REPEAT_FAST = 60;
/** After this long holding, the repeat speeds up (the fill then runs continuously). */
const REPEAT_ACCEL_AFTER = 1000;

/**
 * Stepper — compact -/+ control for incrementing or decrementing a value.
 * - The count swaps in place, lifting toward the direction of the step
 * - `meter`: light follows the value — a dim accent fill sized to the range,
 *   brightening with a lit edge at max; a further + flickers that edge
 * - Press-and-hold to repeat, quickening after a second of holding
 * - Haptic feedback on each step; a refused tap at a bound flickers
 * - Compact mode (just -/+, no value display)
 * - Disabled state with visual feedback
 */
export const Stepper = forwardRef<React.ElementRef<typeof View>, StepperProps>(
  function Stepper(
    { value: controlledValue, defaultValue = 0, onValueChange, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, step = 1, disabled, className, showValue = true, repeat = true, meter = false, ...props },
    ref
  ) {
    const haptics = useHaptic();
    const reduceMotion = useReducedMotion();
    const [internal, setInternal] = React.useState(defaultValue);
    // Resolve during render, never in a passive effect.
    const value = controlledValue ?? internal;
    const canDecrement = !disabled && value > min;
    const canIncrement = !disabled && value < max;

    // ── Meter: light follows the value ────────────────────────────────────
    const metered =
      meter && showValue && min > Number.MIN_SAFE_INTEGER && max < Number.MAX_SAFE_INTEGER && max > min;
    const fraction = metered ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
    const atMax = metered && value >= max;
    const [pillW, setPillW] = React.useState(0);
    const fill = useSharedValue(fraction);
    const glow = useSharedValue(atMax ? 1 : 0);
    const edge = useSharedValue(atMax ? 1 : 0);
    const pop = useSharedValue(1);
    React.useEffect(() => {
      // Fill length is travel — under reduced motion it lands instantly.
      fill.value = reduceMotion ? fraction : withSpring(fraction, spring.glide);
    }, [fraction, fill, reduceMotion]);
    const wasAtMax = React.useRef(atMax);
    React.useEffect(() => {
      if (wasAtMax.current === atMax) return;
      wasAtMax.current = atMax;
      glow.value = withTiming(atMax ? 1 : 0, atMax ? METER_IGNITE : METER_DIM_OUT);
      edge.value = withTiming(atMax ? 1 : 0, atMax ? METER_IGNITE : METER_DIM_OUT);
      if (atMax && !reduceMotion) {
        // The one spark: the value reached the top of its range.
        pop.value = withSequence(withTiming(METER_POP, METER_IGNITE), withSpring(1, spring.pop));
      }
    }, [atMax, glow, edge, pop, reduceMotion]);
    const refuseAtMax = React.useCallback(() => {
      if (!atMax || disabled) return false;
      // Flicker the lit edge, not the icon — a light that won't go brighter.
      edge.value = EDGE_FLICKER;
      edge.value = withSpring(1, spring.shake);
      return true;
    }, [atMax, disabled, edge]);
    const pillStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
    const fillStyle = useAnimatedStyle(() => ({
      // Unlit until the pill is measured, so the fill never flashes full width.
      opacity: pillW > 0 ? METER_DIM + (METER_LIT - METER_DIM) * glow.value : 0,
      transform: [{ translateX: (fill.value - 1) * pillW }],
    }));
    const edgeStyle = useAnimatedStyle(() => ({ opacity: edge.value }));

    const emit = React.useCallback(
      (next: number) => {
        if (next === value) return false;
        if (controlledValue === undefined) setInternal(next);
        onValueChange?.(next);
        return true;
      },
      [value, controlledValue, onValueChange]
    );

    const decrement = React.useCallback(() => {
      return emit(Math.max(value - step, min));
    }, [value, step, min, emit]);

    const increment = React.useCallback(() => {
      return emit(Math.min(value + step, max));
    }, [value, step, max, emit]);

    // Latest callbacks for the repeat interval — the interval would
    // otherwise keep calling the long-press-time closure with a stale value.
    const decRef = React.useRef(decrement);
    decRef.current = decrement;
    const incRef = React.useRef(increment);
    incRef.current = increment;

    // Press-and-hold repeat
    const repeatTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const stopRepeat = React.useCallback(() => {
      if (repeatTimer.current) {
        clearTimeout(repeatTimer.current);
        repeatTimer.current = null;
      }
    }, []);
    const startRepeat = (kind: "dec" | "inc") => {
      if (!repeat) return;
      stopRepeat();
      const tick = () => {
        // Haptic only when the value actually moves — silent at bounds.
        const moved = kind === "dec" ? decRef.current() : incRef.current();
        // `light` impact per tick — `selection` at 10Hz is a buzz, not a tick.
        if (moved) haptics.light();
      };
      // Repeat after a short hold, then quicken once the hold is long.
      repeatTimer.current = setTimeout(() => {
        const started = Date.now();
        const run = () => {
          tick();
          const quick = Date.now() - started >= REPEAT_ACCEL_AFTER;
          repeatTimer.current = setTimeout(run, quick ? REPEAT_FAST : REPEAT_SLOW);
        };
        repeatTimer.current = setTimeout(run, REPEAT_SLOW);
      }, REPEAT_DELAY);
    };
    React.useEffect(() => stopRepeat, [stopRepeat]);

    return (
      <Animated.View
        ref={ref}
        onLayout={metered ? (e) => setPillW(e.nativeEvent.layout.width) : undefined}
        style={metered ? pillStyle : undefined}
        className={cn(
          showValue
            ? // 44pt value pill — the cart / booking quantity idiom.
              cn(
                "h-11 flex-row items-center self-start rounded-full border border-border bg-background px-1",
                metered && "overflow-hidden"
              )
            : // Compact — borderless filled segment pair with a hairline divider.
              "h-8 flex-row items-center self-start overflow-hidden rounded-lg bg-secondary",
          disabled && "opacity-50",
          className
        )}
        accessibilityRole="spinbutton"
        accessibilityValue={{
          min,
          max,
          now: value,
          text: String(value),
        }}
        accessibilityState={{ disabled }}
        // accessibilityValue/accessibilityState aren't forwarded to the DOM
        // on web — mirror them with explicit aria-* props.
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={String(value)}
        aria-disabled={disabled ?? false}
        {...props}
      >
        {metered ? (
          <>
            <Animated.View
              pointerEvents="none"
              className="absolute bottom-0 left-0 top-0 w-full bg-primary"
              style={fillStyle}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
            <Animated.View
              pointerEvents="none"
              className="absolute bottom-0 left-0 right-0 top-0 rounded-full border border-primary"
              style={edgeStyle}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          </>
        ) : null}
        <StepperButton
          shape={showValue ? "pill" : "segment"}
          onPress={decrement}
          onLongPress={() => startRepeat("dec")}
          onPressOut={stopRepeat}
          disabled={!canDecrement}
          accessibilityLabel="Decrease value"
          icon="minus"
        />
        {showValue ? (
          <RollingNumber value={value} />
        ) : (
          <View className="h-4 w-px bg-border" accessibilityElementsHidden importantForAccessibility="no" />
        )}
        <StepperButton
          shape={showValue ? "pill" : "segment"}
          onPress={increment}
          onLongPress={() => startRepeat("inc")}
          onPressOut={stopRepeat}
          disabled={!canIncrement}
          onRefused={metered ? refuseAtMax : undefined}
          accessibilityLabel="Increase value"
          icon="plus"
        />
      </Animated.View>
    );
  }
);

Stepper.displayName = "Stepper";
