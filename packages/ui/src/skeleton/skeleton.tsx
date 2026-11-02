import * as React from "react";
import { forwardRef } from "react";
import { View, type ViewProps } from "react-native";
import { SwitchOn, cn, rowDelay } from "@lumioui/core";

export interface SkeletonProps extends Omit<ViewProps, "className"> {
  className?: string;
  /**
   * "pulse" (default): a still, dim block.
   * @deprecated "shimmer" — now identical to "pulse". Nothing moves across a
   * placeholder: loading is still, dim structure that switches on when ready.
   */
  variant?: "pulse" | "shimmer";
  /** Kept for compatibility — the block is always still. Default true. */
  active?: boolean;
}

/**
 * Skeleton — one still, dim block in the exact shape of the content that
 * replaces it (DESIGN-TASTE §0b: loading is dim structure that switches on).
 * No sweep, no pulse. Pair it with `SkeletonSwitch`, which brings the real
 * content on in place.
 */
export const Skeleton = forwardRef<React.ElementRef<typeof View>, SkeletonProps>(function Skeleton(
  // `variant` and `active` no longer change anything; destructured so they never reach the View.
  { className, variant: _variant, active: _active, ...props },
  ref
) {
  return (
    <View
      ref={ref}
      className={cn("overflow-hidden rounded-lg bg-muted", className)}
      accessible={false}
      // Placeholder blocks announce nothing; the surrounding context carries the busy state.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      {...props}
    />
  );
});
Skeleton.displayName = "Skeleton";

export interface SkeletonSwitchProps extends Omit<ViewProps, "className" | "children"> {
  /** false shows `placeholder`; true switches the real content on in place. */
  loaded: boolean;
  /** The dim layout shown while loading — the exact shape of `children`. */
  placeholder: React.ReactNode;
  /** The real content. Each top-level child switches on in turn on the row rhythm. */
  children: React.ReactNode;
  className?: string;
}

/**
 * SkeletonSwitch — loading that switches on. While `loaded` is false it shows
 * the still, dim layout; when it turns true the real content switches on
 * (dim → on) in hierarchy order, 40ms apart, in place — no pop, no layout
 * shift, nothing sweeping across.
 *   <SkeletonSwitch loaded={ready} placeholder={<InboxBones />}>{rows}</SkeletonSwitch>
 */
export const SkeletonSwitch = forwardRef<React.ElementRef<typeof View>, SkeletonSwitchProps>(function SkeletonSwitch(
  { loaded, placeholder, children, className, ...props },
  ref
) {
  return (
    <View ref={ref} className={cn("overflow-hidden", className)} accessibilityState={{ busy: !loaded }} {...props}>
      {loaded
        ? React.Children.toArray(children).map((child, i) => (
            <SwitchOn key={i} delay={rowDelay(i)}>
              {child}
            </SwitchOn>
          ))
        : placeholder}
    </View>
  );
});
SkeletonSwitch.displayName = "SkeletonSwitch";
