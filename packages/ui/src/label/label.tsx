import * as React from "react";
import { forwardRef } from "react";
import { Text, type TextProps } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { cn, ease, spring, timing, useReducedMotion, useTheme } from "@lumioui/core";

export interface LabelProps extends Omit<TextProps, "className"> {
  /** Id this label answers to — applied as the label's own nativeID so a
   *  control can name it via `accessibilityLabelledBy`/`aria-labelledby`:
   *  `<Label htmlFor="email">Email</Label>` + `<Input accessibilityLabelledBy="email" />`.
   *  (RN has no htmlFor→focus wiring; the association is the shared id.) */
  htmlFor?: string;
  /** Explicit id for the label node (maps to nativeID, and the DOM id on web). */
  id?: string;
  /** Own nativeID — wins over id/htmlFor when several are set. */
  nativeID?: string;
  /** Muted/destructive error variant. */
  error?: boolean;
  /**
   * Opt-in Lumio refusal: when `error` turns on, the label flickers once
   * (dips to 0.6, released on the flicker spring) while its ink shifts
   * foreground → destructive over 250ms; clearing shifts back with no
   * flicker. Off by default — the label then switches tone instantly.
   */
  flicker?: boolean;
  /** NativeWind classes. */
  className?: string;
}

/** How far the label dims on the refusal flicker. */
const FLICKER_DIP = 0.6;
const SHIFT = { ...timing.normal, easing: Easing.bezier(...ease.inOut) };

/**
 * Label — form label with an htmlFor-style id association and error styling.
 * RN's accessibilityRole union has no "label" role — "text" is the correct
 * role; the association lives on the shared nativeID, not the role.
 */
export const Label = forwardRef<React.ElementRef<typeof Text>, LabelProps>(
  function Label({ htmlFor, id, nativeID, error, flicker = false, className, ...props }, ref) {
    if (flicker) {
      return (
        <FlickerLabel
          ref={ref}
          nativeID={nativeID ?? id ?? htmlFor}
          error={!!error}
          className={className}
          {...props}
        />
      );
    }
    return (
      <Text
        ref={ref}
        nativeID={nativeID ?? id ?? htmlFor}
        className={cn(
          "text-sm font-medium",
          error ? "text-destructive" : "text-foreground",
          className
        )}
        accessibilityRole="text"
        {...props}
      />
    );
  }
);

Label.displayName = "Label";

interface FlickerLabelProps extends Omit<TextProps, "className"> {
  error: boolean;
  className?: string;
}

/** The flicker path: ink is a shared value on the UI thread, so the tone
 *  shifts continuously instead of snapping between two classes. */
const FlickerLabel = forwardRef<React.ElementRef<typeof Text>, FlickerLabelProps>(
  function FlickerLabel({ error, className, style, ...props }, ref) {
    const { colors } = useTheme();
    const reduce = useReducedMotion();
    const tone = useSharedValue(error ? 1 : 0);
    const glow = useSharedValue(1);
    const was = React.useRef(error);

    React.useEffect(() => {
      if (was.current === error) return;
      was.current = error;
      tone.value = withTiming(error ? 1 : 0, SHIFT);
      if (!error) return;
      // One flicker — a light that won't switch on. Reduced motion keeps it:
      // it is opacity, not travel.
      glow.value = reduce
        ? withSequence(withTiming(FLICKER_DIP, timing.instant), withTiming(1, SHIFT))
        : withSequence(withTiming(FLICKER_DIP, timing.instant), withSpring(1, spring.shake));
    }, [error, reduce, tone, glow]);

    const foreground = colors.foreground;
    const destructive = colors.destructive;
    const animated = useAnimatedStyle(() => ({
      opacity: glow.value,
      color: interpolateColor(tone.value, [0, 1], [foreground, destructive]),
    }));

    return (
      <Animated.Text
        ref={ref as React.Ref<React.ElementRef<typeof Animated.Text>>}
        className={cn("text-sm font-medium text-foreground", className)}
        accessibilityRole="text"
        style={[style, animated]}
        {...props}
      />
    );
  }
);
