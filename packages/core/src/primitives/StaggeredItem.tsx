import * as React from "react";
import { useEffect } from "react";
import { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { spring, timing } from "../tokens/animation";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { ViewProps } from "react-native";
import type { AnimatedViewStyle } from "../utils/styled";

/**
 * Animated.View as seen by NativeWind after the cssInterop registration in
 * utils/styled.ts — accepts className alongside the animated style. The
 * ViewProps-based cast mirrors the AnimatedPressable/AnimatedTextInput typing.
 */
const AnimatedView = Animated.View as React.ComponentType<
  Omit<ViewProps, "style"> & { className?: string; style?: AnimatedViewStyle }
>;

export interface StaggeredItemProps extends ViewProps {
  /** Index of this item in the list — determines delay. */
  index: number;
  /** Delay between each item in ms. Default 40. */
  staggerMs?: number;
  /** Initial delay before first item in ms. Default 0. */
  initialDelayMs?: number;
  /** Delay ceiling in ms. Default 300 — without a cap, deep rows in long
   *  lists (and items mounting lazily on scroll) wait seconds for a
   *  stagger meant to feel instant. Past the cap, items enter together. */
  maxDelayMs?: number;
  /** Slide distance for entrance. Default 8. */
  slideDistance?: number;
  /** Whether to animate. Default true. */
  active?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * StaggeredItem — wraps a child in a fade+slide entrance animation
 * that's delayed based on its `index` prop. Use inside lists, sheets,
 * menus, and toasts for the cascade entrance.
 *
 * Usage:
 *   items.map((item, i) => (
 *     <StaggeredItem key={i} index={i}>
 *       <Text>{item.label}</Text>
 *     </StaggeredItem>
 *   ))
 */
export function StaggeredItem({
  index,
  staggerMs = 40,
  initialDelayMs = 0,
  maxDelayMs = 300,
  slideDistance = 8,
  active = true,
  children,
  className,
  ...props
}: StaggeredItemProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(active && !reduceMotion ? 0 : 1);
  const translateY = useSharedValue(active && !reduceMotion ? slideDistance : 0);

  useEffect(() => {
    if (!active || reduceMotion) {
      // Reduced motion: set the final state directly, no travel.
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    const delay = Math.min(initialDelayMs + index * staggerMs, maxDelayMs);
    opacity.value = withDelay(delay, withTiming(1, timing.fast));
    translateY.value = withDelay(delay, withSpring(0, spring.layout));
  }, [active, reduceMotion, index, staggerMs, initialDelayMs, maxDelayMs, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <AnimatedView style={animatedStyle} className={className} {...props}>
      {children}
    </AnimatedView>
  );
}

StaggeredItem.displayName = "StaggeredItem";
