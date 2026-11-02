import * as React from "react";
import { forwardRef, useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  AnimatedPressable,
  AnimatedTextInput,
  cn,
  createVariant,
  ease,
  spring,
  timing,
  useHaptic,
  usePressAnimation,
  useReducedMotion,
  useTheme,
} from "@lumioui/core";
import { Icon, type IconName } from "../icon";

/**
 * NumberInput — an editable numeric field flanked by − / + buttons, with a
 * prefix (`$`) or unit suffix (`kg`, `servings`), min / max / step and
 * decimal precision. Tap to type an exact value (clamped on commit), tap
 * the buttons to step, hold them to repeat with acceleration.
 *
 * Motion: each step swaps the number in place with direction — the old
 * figure dims and drifts 2pt the way the count is going while the new one
 * ignites and settles 4pt into place, so a count up rises and a count down
 * falls. Hitting a bound flickers the button once (a 4pt kick, opacity
 * dipping to 0.6) with a warning haptic; an out-of-range typed value
 * flickers the field the same way as it snaps back into range. `onStep`
 * reports each step with its direction and whether a hold is repeating, so
 * a screen can carry the change on (quantities below swapping in turn).
 *
 *   <NumberInput label="Servings" defaultValue={4} min={1} max={12} unit="servings" />
 *
 * Expo Go compatible.
 */

/** Flicker for "can't": one small kick, released into spring.shake… */
const KICK = 4;
/** …while the light dips to this and comes back. */
const FLICKER_DIM = 0.6;
/** A swapping figure's travel (pt) — inside the §5 count cap. */
const SWAP_TRAVEL = 4;
/** Hold-to-repeat: first repeat after 380ms, then every 110ms, speeding to
 *  45ms after ten ticks (stepper acceleration feel). */
const REPEAT_DELAY = 380;
const REPEAT_SLOW = 110;
const REPEAT_FAST = 45;

const fieldVariants = createVariant({
  base: "flex-row items-center",
  variants: {
    variant: {
      field: "rounded-xl border-[1.5px] bg-card px-1",
      inline: "rounded-full bg-secondary px-1",
    },
    size: {
      sm: "h-9",
      md: "h-12",
      lg: "h-14",
    },
  },
  defaultVariants: { variant: "field", size: "md" },
});

const valueTextVariants = createVariant({
  base: "text-center font-semibold tabular-nums text-foreground",
  variants: {
    size: { sm: "text-[15px]", md: "text-lg", lg: "text-2xl" },
  },
  defaultVariants: { size: "md" },
});

const BUTTON_SIZE = { sm: "h-7 w-7", md: "h-10 w-10", lg: "h-12 w-12" } as const;
const HIT = { sm: 8, md: 2, lg: 0 } as const;
/** Approximate tabular-digit advance per size (≈0.6em). The TextInput is
 *  sized to its content — on web an <input> otherwise claims its default
 *  ~20-character intrinsic width and an inline stepper balloons over its
 *  neighbours in a row. */
const DIGIT_WIDTH = { sm: 9, md: 11, lg: 15 } as const;

function round(n: number, precision: number) {
  const f = 10 ** precision;
  return Math.round(n * f) / f;
}

interface StepButtonProps {
  icon: IconName;
  label: string;
  atBound: boolean;
  disabled?: boolean;
  size: "sm" | "md" | "lg";
  /** Which way the button pushes — the flicker kicks that way. */
  dir: 1 | -1;
  onStep: (repeating: boolean) => boolean;
}

function StepButton({ icon, label, atBound, disabled, size, dir, onStep }: StepButtonProps) {
  const haptics = useHaptic();
  const reduceMotion = useReducedMotion();
  const press = usePressAnimation({ pressedScale: 0.88, pressedOpacity: 0.7 });
  const nudge = useSharedValue(0);
  const flicker = useSharedValue(1);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticks = React.useRef(0);
  const stepRef = React.useRef(onStep);
  stepRef.current = onStep;

  const stop = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    ticks.current = 0;
  }, []);
  React.useEffect(() => stop, [stop]);

  const nope = () => {
    haptics.warning();
    flicker.value = withSequence(withTiming(FLICKER_DIM, timing.instant), withTiming(1, timing.fast));
    if (!reduceMotion) {
      nudge.value = KICK * dir;
      nudge.value = withSpring(0, spring.shake);
    }
  };

  const repeat = () => {
    const moved = stepRef.current(true);
    if (!moved) {
      stop();
      return;
    }
    haptics.light();
    ticks.current += 1;
    timer.current = setTimeout(repeat, ticks.current > 10 ? REPEAT_FAST : REPEAT_SLOW);
  };

  const nudgeStyle = useAnimatedStyle(() => ({ opacity: flicker.value, transform: [{ translateX: nudge.value }] }));
  const off = disabled || atBound;

  return (
    <AnimatedPressable
      // Never responder-disabled so a tap at the bound can still answer.
      disabled={disabled}
      onPress={() => {
        if (off) return nope();
        if (stepRef.current(false)) haptics.selection();
      }}
      onLongPress={() => {
        if (off) return;
        timer.current = setTimeout(repeat, 0);
      }}
      delayLongPress={REPEAT_DELAY}
      onPressIn={() => {
        if (!off) press.onPressIn();
      }}
      onPressOut={() => {
        press.onPressOut();
        stop();
      }}
      style={press.animatedStyle}
      className={cn(BUTTON_SIZE[size], "items-center justify-center rounded-full", off && "opacity-40")}
      hitSlop={HIT[size]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off }}
      aria-disabled={off}
    >
      <Animated.View style={nudgeStyle}>
        <Icon name={icon} size={size === "lg" ? "md" : "sm"} color="foreground" strokeWidth={2.5} />
      </Animated.View>
    </AnimatedPressable>
  );
}

export interface NumberInputProps
  extends Omit<TextInputProps, "value" | "defaultValue" | "onChangeText" | "className" | "keyboardType"> {
  /** Controlled value. */
  value?: number;
  /** Uncontrolled initial value. Default `min` if finite, else 0. */
  defaultValue?: number;
  /** Fires on every committed change (step, hold tick, typed commit). */
  onValueChange?: (value: number) => void;
  /** Fires on each button / a11y step with its direction, and `repeating`
   *  while a held button is auto-stepping — e.g. to tighten a cascade. */
  onStep?: (value: number, info: { direction: 1 | -1; repeating: boolean }) => void;
  /** Lower bound. Default -Infinity. */
  min?: number;
  /** Upper bound. Default Infinity. */
  max?: number;
  /** Step for the buttons. Default 1. */
  step?: number;
  /** Decimal places kept and displayed. Default: the step's decimals. */
  precision?: number;
  /** Text before the number (`$`, `€`). */
  prefix?: string;
  /** Unit after the number (`kg`, `min`, `servings`). */
  unit?: string;
  /** Group thousands with commas (`1,250`). Default true. */
  thousands?: boolean;
  /** Label above the field. */
  label?: string;
  /** Helper text under the field — replaced by the range hint when a typed
   *  value was clamped. */
  helper?: string;
  /** Allow typing. Default true; false makes the value read-only text. */
  editable?: boolean;
  /** "field" bordered input (default) or "inline" pill for list rows. */
  variant?: "field" | "inline";
  /** sm 36 (rows) · md 48 · lg 56 (hero). Default md. */
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  /** Stretch to the parent width. Default true for field, false for inline. */
  fullWidth?: boolean;
  /** Classes for the outer wrapper. */
  className?: string;
}

export const NumberInput = forwardRef<React.ElementRef<typeof TextInput>, NumberInputProps>(function NumberInput(
  {
    value,
    defaultValue,
    onValueChange,
    onStep,
    min = -Infinity,
    max = Infinity,
    step = 1,
    precision,
    prefix,
    unit,
    thousands = true,
    label,
    helper,
    editable = true,
    variant = "field",
    size = "md",
    disabled,
    fullWidth,
    className,
    onFocus,
    onBlur,
    accessibilityLabel,
    ...props
  },
  ref
) {
  const haptics = useHaptic();
  const reduceMotion = useReducedMotion();
  const { colors } = useTheme();
  const decimals = precision ?? (String(step).split(".")[1]?.length ?? 0);
  const clamp = React.useCallback((n: number) => round(Math.min(max, Math.max(min, n)), decimals), [min, max, decimals]);

  const [internal, setInternal] = useState(() => clamp(defaultValue ?? (Number.isFinite(min) ? min : 0)));
  const current = value ?? internal;
  const currentRef = React.useRef(current);
  currentRef.current = current;

  const [draft, setDraft] = useState<string | null>(null);
  const [clampNote, setClampNote] = useState<string | null>(null);

  // Swap in place: the incoming figure ignites (inT) and settles (rise); the
  // outgoing copy dims (outT). swapDir is +1 counting up, −1 counting down.
  const inT = useSharedValue(1);
  const rise = useSharedValue(1);
  const outT = useSharedValue(1);
  const swapDir = useSharedValue(1);
  const [outgoing, setOutgoing] = useState<string | null>(null);
  const shake = useSharedValue(0);
  const flicker = useSharedValue(1);
  const focusT = useSharedValue(0);

  const format = (n: number) => {
    const fixed = n.toFixed(decimals);
    if (!thousands) return fixed;
    const [int, dec] = fixed.split(".");
    const grouped = (int ?? "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return dec ? `${grouped}.${dec}` : grouped;
  };

  const commit = React.useCallback(
    (next: number) => {
      if (next === currentRef.current) return false;
      currentRef.current = next;
      if (value === undefined) setInternal(next);
      onValueChange?.(next);
      return true;
    },
    [value, onValueChange]
  );

  const stepBy = (dir: 1 | -1) => (repeating = false) => {
    const prev = currentRef.current;
    const next = clamp(prev + dir * step);
    const moved = commit(next);
    if (moved) {
      setClampNote(null);
      setDraft(null);
      setOutgoing(format(prev));
      swapDir.value = dir;
      outT.value = 0;
      outT.value = withTiming(1, { ...timing.recede, easing: Easing.bezier(...ease.in) });
      inT.value = 0;
      inT.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
      if (reduceMotion) rise.value = 1;
      else {
        rise.value = 0;
        rise.value = withSpring(1, spring.swap);
      }
      onStep?.(next, { direction: dir, repeating });
    }
    return moved;
  };

  const commitDraft = () => {
    if (draft === null) return;
    const parsed = Number(draft.replace(/[^0-9.-]/g, ""));
    setDraft(null);
    if (!draft.trim() || Number.isNaN(parsed)) return;
    const next = clamp(parsed);
    if (next !== round(parsed, decimals)) {
      haptics.warning();
      setClampNote(
        Number.isFinite(min) && Number.isFinite(max)
          ? `Between ${prefix ?? ""}${format(min)} and ${prefix ?? ""}${format(max)}${unit ? ` ${unit}` : ""}`
          : next === max
            ? `Up to ${prefix ?? ""}${format(max)}${unit ? ` ${unit}` : ""}`
            : `At least ${prefix ?? ""}${format(min)}${unit ? ` ${unit}` : ""}`
      );
      flicker.value = withSequence(withTiming(FLICKER_DIM, timing.instant), withTiming(1, timing.fast));
      if (!reduceMotion) {
        shake.value = -KICK;
        shake.value = withSpring(0, spring.shake);
      }
    } else setClampNote(null);
    commit(next);
  };

  const fieldStyle = useAnimatedStyle(() => ({
    opacity: flicker.value * (disabled ? 0.5 : 1),
    transform: [{ translateX: shake.value }],
    borderColor:
      variant === "inline"
        ? "transparent"
        : clampNote
          ? colors.warning
          : interpolateColor(focusT.value, [0, 1], [colors.input, colors.ring]),
  }));
  const incomingStyle = useAnimatedStyle(() => ({
    opacity: inT.value,
    transform: [{ translateY: (1 - rise.value) * SWAP_TRAVEL * swapDir.value }],
  }));
  // Dim to leave: the exit drifts half as far as the entrance, the way the count goes.
  const outgoingStyle = useAnimatedStyle(() => ({
    opacity: 1 - outT.value,
    transform: reduceMotion ? [] : [{ translateY: -outT.value * (SWAP_TRAVEL / 2) * swapDir.value }],
  }));

  const handleA11y = (e: { nativeEvent: { actionName: string } }) => {
    const moved = stepBy(e.nativeEvent.actionName === "increment" ? 1 : -1)();
    if (moved) haptics.selection();
  };

  const wide = fullWidth ?? variant === "field";
  const display = draft ?? format(current);
  const textSize = valueTextVariants({ size });
  const affix = cn(
    "text-muted-foreground",
    size === "lg" ? "text-lg font-medium" : size === "sm" ? "text-[15px]" : "text-base"
  );

  return (
    <View className={cn(wide ? "w-full" : "self-start", "gap-1.5", className)}>
      {label ? <Text className="text-sm font-medium text-foreground">{label}</Text> : null}
      <Animated.View
        style={fieldStyle}
        className={cn(fieldVariants({ variant, size }), wide && "w-full")}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityValue={{ min: Number.isFinite(min) ? min : undefined, max: Number.isFinite(max) ? max : undefined, now: current, text: `${prefix ?? ""}${format(current)}${unit ? ` ${unit}` : ""}` }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={handleA11y}
      >
        <StepButton
          icon="minus"
          label="Decrease"
          size={size}
          atBound={current <= min}
          dir={-1}
          disabled={disabled}
          onStep={stepBy(-1)}
        />
        <View
          className={cn("flex-row items-center justify-center gap-1", wide ? "flex-1" : size === "sm" ? "min-w-[56px] px-1" : "min-w-[88px] px-2")}
        >
          {prefix ? <Text className={affix}>{prefix}</Text> : null}
          <View>
            {outgoing !== null ? (
              <Animated.View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                className="absolute inset-0 items-center justify-center"
                style={outgoingStyle}
              >
                <Text numberOfLines={1} className={textSize}>
                  {outgoing}
                </Text>
              </Animated.View>
            ) : null}
            <Animated.View style={incomingStyle}>
              {editable && !disabled ? (
                <AnimatedTextInput
                  ref={ref}
                  value={display}
                  onChangeText={setDraft}
                  onFocus={(e) => {
                    focusT.value = reduceMotion ? 1 : withTiming(1, timing.fast);
                    setDraft(String(current));
                    onFocus?.(e);
                  }}
                  onBlur={(e) => {
                    focusT.value = reduceMotion ? 0 : withTiming(0, timing.fast);
                    commitDraft();
                    onBlur?.(e);
                  }}
                  onSubmitEditing={commitDraft}
                  keyboardType={decimals > 0 ? "decimal-pad" : "number-pad"}
                  returnKeyType="done"
                  selectTextOnFocus
                  className={cn(textSize, "min-w-[24px] p-0")}
                  style={{ width: Math.max(24, display.length * DIGIT_WIDTH[size] + 4) }}
                  accessibilityLabel={accessibilityLabel ?? label ?? "Value"}
                  {...props}
                />
              ) : (
                <Text className={textSize}>{format(current)}</Text>
              )}
            </Animated.View>
          </View>
          {unit ? <Text className={affix}>{unit}</Text> : null}
        </View>
        <StepButton
          icon="plus"
          label="Increase"
          size={size}
          atBound={current >= max}
          dir={1}
          disabled={disabled}
          onStep={stepBy(1)}
        />
      </Animated.View>
      {clampNote || helper ? (
        <Text className={cn("text-sm", clampNote ? "text-foreground" : "text-muted-foreground")} accessibilityLiveRegion="polite">
          {clampNote ?? helper}
        </Text>
      ) : null}
    </View>
  );
});

NumberInput.displayName = "NumberInput";
