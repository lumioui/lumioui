import { useCallback } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { spring, timing } from "../tokens/animation";
import { useReducedMotion } from "./useReducedMotion";

/** Press dim under Reduce Motion — light feedback that replaces the scale. */
const REDUCED_PRESS_OPACITY = 0.7;

export interface PressAnimation {
  /** Bind to onPressIn. */
  onPressIn: () => void;
  /** Bind to onPressOut. */
  onPressOut: () => void;
  /** Style to apply to an Animated.View wrapper. */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  /** Raw scale value if custom styling is needed. */
  scale: SharedValue<number>;
}

export interface PressAnimationOptions {
  /** Scale when pressed. Default 0.97 — subtle, tactile. */
  pressedScale?: number;
  /** Opacity when pressed. Default 1. */
  pressedOpacity?: number;
  /** Disabled state — rests the animated element at half opacity. Needed
   *  because the animated style's inline `opacity: 1` silently overrides a
   *  `disabled && "opacity-50"` className on the same element (web). */
  disabled?: boolean;
  /** Use timing instead of spring (for very quick feedback). */
  fast?: boolean;
}

/**
 * Spring-animated press feedback — the mobile replacement for CSS :active.
 * Every LumioUI interactive component uses this for consistent feel.
 */
export function usePressAnimation(options: PressAnimationOptions = {}): PressAnimation {
  const { pressedScale = 0.97, pressedOpacity = 1, disabled = false, fast = false } = options;
  // Under Reduce Motion there is no scale, so the press needs a visible
  // dim of its own; a caller's explicit pressedOpacity still wins.
  const reducedOpacity = options.pressedOpacity ?? REDUCED_PRESS_OPACITY;
  // Reduced motion: keep the opacity feedback, snap scale instantly —
  // no travel. Consumers get this for free; no per-component gating needed.
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const onPressIn = useCallback(() => {
    if (reduceMotion) {
      // Keep the opacity wash, skip the scale travel entirely.
      opacity.value = reducedOpacity;
    } else if (fast) {
      scale.value = withTiming(pressedScale, timing.fast);
      opacity.value = withTiming(pressedOpacity, timing.fast);
    } else {
      scale.value = withSpring(pressedScale, spring.press);
      opacity.value = withSpring(pressedOpacity, spring.press);
    }
  }, [fast, pressedScale, pressedOpacity, reducedOpacity, reduceMotion, scale, opacity]);

  const onPressOut = useCallback(() => {
    if (reduceMotion) {
      opacity.value = 1;
    } else if (fast) {
      scale.value = withTiming(1, timing.fast);
      opacity.value = withTiming(1, timing.fast);
    } else {
      scale.value = withSpring(1, spring.press);
      opacity.value = withSpring(1, spring.press);
    }
  }, [fast, reduceMotion, scale, opacity]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value * (disabled ? 0.5 : 1),
    }),
    [disabled]
  );

  return { onPressIn, onPressOut, animatedStyle, scale };
}
