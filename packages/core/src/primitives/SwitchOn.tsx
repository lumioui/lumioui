import * as React from "react";
import type { ViewProps } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { useReducedMotion } from "../hooks";
import { ease, timing } from "../tokens/animation";

/*
 * Switch-on — how Lumio content arrives (DESIGN-TASTE §5c rule 6).
 * A block starts dim but readable, then switches on with a small rise.
 * Page bands step on the slow rhythm, rows and tiles on the fast one.
 */

/** Brightness a block starts at before it switches on. */
export const SWITCH_DIM = 0.35;
/** Rise in points as it switches on. */
export const SWITCH_RISE = 6;
/** Page bands step on this rhythm. */
export const BAND_STAGGER = 120;
/** Rows and tiles step on this rhythm. */
export const ROW_STAGGER = 40;
/** A long list never waits more than this for its last row. */
export const ROW_STAGGER_CAP = 300;
/** Row delay for index i on the fast rhythm, capped. */
export const rowDelay = (i: number) => Math.min(i * ROW_STAGGER, ROW_STAGGER_CAP);

export interface SwitchOnProps extends ViewProps {
  /** Wait before switching on, in ms. */
  delay?: number;
  className?: string;
}

/** SwitchOn — a block that starts dim and switches on after `delay`. */
export function SwitchOn({ delay = 0, style, children, ...rest }: SwitchOnProps) {
  const reduce = useReducedMotion();
  const on = useSharedValue(0);
  const rise = useSharedValue(reduce ? 1 : 0);
  React.useEffect(() => {
    on.value = withDelay(delay, withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) }));
    if (reduce) {
      rise.value = 1;
      return;
    }
    rise.value = withDelay(delay, withTiming(1, { ...timing.normal, easing: Easing.bezier(...ease.out) }));
  }, [delay, reduce, on, rise]);
  const animated = useAnimatedStyle(() => ({
    opacity: SWITCH_DIM + (1 - SWITCH_DIM) * on.value,
    transform: [{ translateY: (1 - rise.value) * SWITCH_RISE }],
  }));
  return (
    <Animated.View style={[animated, style]} {...rest}>
      {children}
    </Animated.View>
  );
}
SwitchOn.displayName = "SwitchOn";
