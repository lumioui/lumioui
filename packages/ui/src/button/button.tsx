import * as React from "react";
import { forwardRef } from "react";
import { Pressable, type PressableProps, type GestureResponderEvent, type LayoutChangeEvent, } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  withRepeat,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withDelay,
  interpolateColor,
  type SharedValue,
} from "react-native-reanimated";
import { cn, createVariant, useAsyncPress, useHaptic, usePressAnimation, useReducedMotion, useTheme, a11yProps, AnimatedPressable, LitEdge, ease, spring, tempo, timing, type A11yProps, } from "@lumioui/core";
import { Glass } from "../glass";

/** Press depth scales inversely with surface size — a small tap target needs
 *  a deeper dip to read as a press; a large surface needs less travel
 *  (the base press is 0.93; full-width lg CTAs keep the library's 0.97). */
const PRESSED_SCALE = { sm: 0.94, md: 0.95, lg: 0.97, icon: 0.94 } as const;

/** Busy swaps the label for three small dots that brighten in turn, in place —
 *  nothing sweeps across the pill. One cycle of the three dots. */
const BUSY_CYCLE_MS = tempo.roll * 2;
/** Resting and peak brightness of a busy dot. */
const DOT_REST = 0.3;
const DOT_SIZE = 6;

/** Loading swaps in place: the outgoing layer (label or spinner) dims to
 *  0.96 while the incoming one ignites and settles 0.96→1 on spring.swap.
 *  Reduced motion keeps the opacity crossfade only. */
const SWAP_SCALE = 0.96;
const SWAP_DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };
const SWAP_IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
/** `ripple`: a glow ignites at the touch point and spreads to 2× the
 *  longest side while it dims. A fading trace, not UI travel, so it may
 *  outlive the 300ms UI budget — two roll periods. */
const RIPPLE_MS = tempo.roll * 2;
const RIPPLE_OPACITY = 0.22;
const RIPPLE_FROM_SCALE = 0.15;
const rippleEase = Easing.bezier(...ease.out);

const buttonVariants = createVariant({
  base: "flex-row items-center justify-center overflow-hidden",
  variants: {
    variant: {
      // The primary action — filled accent (ink by default)
      default: "bg-primary",
      // Destructive action — red filled
      destructive: "bg-destructive",
      // Outline with a hairline border
      outline: "border border-border bg-transparent",
      // Subtle accent tint background
      tinted: "bg-primary/15",
      // Secondary — neutral fill, no border (one depth treatment)
      secondary: "bg-secondary",
      // No background, just text
      ghost: "bg-transparent",
      link: "bg-transparent",
      // Lumio glass — the material supplies the surface
      glass: "bg-transparent",
    },
    size: {
      // sm 36 (inline row actions, hitSlop to 44) · md 44 (min touch target) ·
      // lg 56 — the full-width screen CTA real apps use.
      sm: "h-9 gap-1.5 px-4",
      md: "h-11 gap-2 px-5",
      lg: "h-14 gap-2 px-7",
      icon: "h-11 w-11 gap-0 px-0",
    },
    radius: {
      pill: "rounded-full",
      xl: "rounded-3xl",
      lg: "rounded-2xl",
      md: "rounded-xl",
    },
  },
  defaultVariants: { variant: "default", size: "md", radius: "pill" },
});

/** `tone` restyles the filled "default" variant for contexts where the accent
 *  pill is wrong — `inverse` is the boutique near-black CTA, `surface` a
 *  bordered card-colored button. Only meaningful with variant="default". */
const toneContainer = {
  accent: "",
  inverse: "bg-foreground",
  surface: "bg-card border border-border",
} as const;
const toneText = {
  accent: "",
  inverse: "text-background",
  surface: "text-foreground",
} as const;

/** Text-like children (string/number/array of them) belong inside the styled
 *  label Text — variant colors only reach them there. Elements (icons, views)
 *  must bypass it: they aren't text and RN can't nest views in Text. */
const isTextualChildren = (node: React.ReactNode): boolean =>
  node == null ||
  typeof node === "boolean" ||
  typeof node === "string" ||
  typeof node === "number" ||
  (Array.isArray(node) && node.every(isTextualChildren));

const buttonTextVariants = createVariant({
  base: "text-base font-semibold",
  variants: {
    variant: {
      default: "text-primary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      tinted: "text-primary-text",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground",
      link: "text-primary-text underline",
      glass: "text-foreground",
    },
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-[17px]",
      icon: "text-base",
    },
  },
  defaultVariants: { variant: "default", size: "md" },
});

export interface ButtonProps extends Omit<PressableProps, "style" | "children" | "onPress">, A11yProps {
  /** Press handler — may return a Promise. With asyncTracking (default) the
   *  button enters the loading state until the promise settles. Declared as
   *  a union of signatures rather than `void | Promise<unknown>` so `void`
   *  keeps its leniency — handlers returning other values (e.g. a timeout
   *  id) still typecheck. */
  onPress?:
    | ((e: GestureResponderEvent) => void)
    | ((e: GestureResponderEvent) => Promise<unknown>)
    | null;
  /** Visual style — "glass" is the glass material button. */
  variant?: "default" | "destructive" | "outline" | "tinted" | "secondary" | "ghost" | "link" | "glass";
  /** Fill voice for the default variant — `inverse` is the near-black CTA,
   *  `surface` a bordered card-colored button. Default "accent". */
  tone?: "accent" | "inverse" | "surface";
  /** Corner radius. Default "pill". */
  radius?: "pill" | "xl" | "lg" | "md";
  /** Size preset. */
  size?: "sm" | "md" | "lg" | "icon";
  /** Swap the label for busy dots and block presses while true. */
  loading?: boolean;
  /** Show the unlit (off) face of a filled button while it stays pressable —
   *  for a gate that answers a tap with a "can't" flicker instead of
   *  ignoring it. Default false. */
  unlit?: boolean;
  /** Auto-track async onPress — when onPress returns a Promise, the button
   *  automatically enters loading state until it resolves. Default true. */
  asyncTracking?: boolean;
  /** @deprecated No effect: busy resolves by swapping the label back in place. */
  sheenOnResolve?: boolean;
  /** Haptic feedback on press. Default "light"; false to disable. */
  haptic?: "light" | "medium" | "heavy" | false;
  /** Override the press-dip scale (1 = none). ButtonGroup sets this to 1 on
   *  attached children — a scaled segment opens a gap in the weld. */
  pressedScale?: number;
  /** Extra NativeWind classes for the container. */
  className?: string;
  /** Extra classes for the label. */
  textClassName?: string;
  /** Icon rendered before the label. */
  icon?: React.ReactNode;
  /** Ignite a glow from the touch point that spreads as it dims (`ripple`).
   *  Off by default; skipped under reduced motion. */
  ripple?: boolean;
  children?: React.ReactNode;
}

/**
 * Button — tactile, spring-animated, haptic-enabled pill.
 * Craft details: heavy spring scale on press, a light overlay that fades in
 * while held (physical "ink"). Busy swaps the label in place for three dots
 * that brighten in turn, and resolving swaps the label back — the pill never
 * snaps or resizes, and nothing sweeps across it. Faces stay flat — depth
 * comes from the press, not from gloss or drop shadows.
 */
export const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  function Button(
    {
      variant = "default",
      size = "md",
      tone = "accent",
      radius = "pill",
      loading = false,
      unlit: unlitProp = false,
      asyncTracking = true,
      // Kept for compatibility — busy now resolves by swapping the label back in, no light pass.
      sheenOnResolve: _sheenOnResolve,
      haptic = "light",
      pressedScale,
      className,
      textClassName,
      icon,
      ripple = false,
      children,
      disabled,
      onPress,
      onPressIn,
      onPressOut,
      onLayout,
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole,
      accessibilityState,
      ...props
    },
    ref
  ) {
    const haptics = useHaptic();
    const reduceMotion = useReducedMotion();
    const { colors } = useTheme();

    // Auto-track async onPress promises
    const asyncPress = useAsyncPress(
      asyncTracking ? (onPress ?? undefined) : undefined,
      {
        haptic: haptic ? () => haptics[haptic]() : undefined,
      }
    );
    const isLoading = loading || asyncPress.loading;
    const isDisabled = disabled || isLoading;
    // Link buttons stay quiet but still acknowledge contact with a restrained
    // scale. Opacity alone makes text actions feel disconnected from touch.
    // `disabled` is folded into the animated style — an opacity className on
    // the same element is overridden by the hook's inline style on web.
    const press = usePressAnimation(
      variant === "link"
        ? { pressedScale: 0.98, pressedOpacity: 0.72, disabled: !!disabled }
        : // Filled buttons show disabled as the unlit layer, never an opacity wash.
          { pressedScale: pressedScale ?? PRESSED_SCALE[size], disabled: !!disabled && variant !== "default" && variant !== "destructive" }
    );

    // Held-state ink overlay — a faint wash that confirms contact instantly.
    const ink = useSharedValue(0);
    // Busy — the label swaps out in place for three dots that brighten in
    // turn; on resolve the dots dim and the label switches back on.
    const labelOpacity = useSharedValue(isLoading ? 0 : 1);
    const labelScale = useSharedValue(1);
    const dotsOn = useSharedValue(isLoading ? 1 : 0);
    const lap = useSharedValue(0);
    const wasLoading = React.useRef(isLoading);

    React.useEffect(() => {
      if (!isLoading || reduceMotion) {
        cancelAnimation(lap);
        return;
      }
      lap.value = 0;
      lap.value = withRepeat(withTiming(1, { duration: BUSY_CYCLE_MS, easing: Easing.linear }), -1, false);
      return () => cancelAnimation(lap);
    }, [isLoading, reduceMotion, lap]);

    React.useEffect(() => {
      if (wasLoading.current === isLoading) return;
      wasLoading.current = isLoading;
      if (isLoading) {
        labelOpacity.value = withTiming(0, SWAP_DIM);
        dotsOn.value = withDelay(timing.recede.duration, withTiming(1, SWAP_IGNITE));
        if (!reduceMotion) labelScale.value = withTiming(SWAP_SCALE, SWAP_DIM);
        return;
      }
      dotsOn.value = withTiming(0, SWAP_DIM);
      labelOpacity.value = withDelay(timing.recede.duration, withTiming(1, SWAP_IGNITE));
      if (reduceMotion) labelScale.value = 1;
      else labelScale.value = withDelay(timing.recede.duration, withSpring(1, spring.swap));
    }, [isLoading, reduceMotion, labelOpacity, labelScale, dotsOn]);

    // Touch-point ripple (opt-in).
    const rippleX = useSharedValue(0);
    const rippleY = useSharedValue(0);
    const rippleSize = useSharedValue(0);
    const rippleP = useSharedValue(1);
    const handleLayout = (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      rippleSize.value = Math.max(width, height) * 2;
      onLayout?.(e);
    };

    const handlePress = (e: GestureResponderEvent) => {
      if (asyncTracking) {
        asyncPress.handlePress(e);
      } else {
        if (haptic) haptics[haptic]();
        onPress?.(e);
      }
    };
    const handlePressIn = (e: GestureResponderEvent) => {
      press.onPressIn?.();
      // The ink wash is opacity feedback — reduced motion keeps it.
      ink.value = withTiming(1, timing.instant);
      if (ripple && !reduceMotion) {
        rippleX.value = e.nativeEvent.locationX;
        rippleY.value = e.nativeEvent.locationY;
        rippleP.value = withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, { duration: RIPPLE_MS, easing: rippleEase })
        );
      }
      onPressIn?.(e);
    };
    const handlePressOut = (e: GestureResponderEvent) => {
      press.onPressOut?.();
      ink.value = withTiming(0, timing.normal);
      onPressOut?.(e);
    };

    const inkStyle = useAnimatedStyle(() => ({ opacity: ink.value * 0.12 }));
    // The pill itself never resizes — only the content inside it swaps.
    const labelStyle = useAnimatedStyle(() => ({
      opacity: labelOpacity.value,
      transform: [{ scale: labelScale.value }],
    }));
    const dotsStyle = useAnimatedStyle(() => ({ opacity: dotsOn.value }));
    const rippleStyle = useAnimatedStyle(() => {
      const size = rippleSize.value;
      return {
        left: rippleX.value - size / 2,
        top: rippleY.value - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        opacity: RIPPLE_OPACITY * (1 - rippleP.value),
        transform: [{ scale: RIPPLE_FROM_SCALE + (1 - RIPPLE_FROM_SCALE) * rippleP.value }],
      };
    });

    const filled = variant === "default" || variant === "destructive";
    // Disabled on a filled button is unlit, not washed out: a muted fill and
    // muted ink crossfade in over timing.fast, and back out when it becomes
    // available, so the button visibly switches on. Other variants keep the
    // opacity dim (they have no fill to unlight).
    const unlitOn = (!!disabled || unlitProp) && filled;
    const unlit = useSharedValue(unlitOn ? 1 : 0);
    React.useEffect(() => {
      unlit.value = withTiming(unlitOn ? 1 : 0, SWAP_IGNITE);
    }, [unlitOn, unlit]);
    const unlitStyle = useAnimatedStyle(() => ({ opacity: unlit.value }));

    // Ink wash from theme tokens: primaryForeground (white) on filled,
    // foreground (scheme-aware) on translucent surfaces.
    const inkColor = filled ? colors.primaryForeground : colors.foreground;
    const lightColor =
      variant === "default"
        ? tone === "inverse"
          ? colors.background
          : tone === "surface"
            ? colors.foreground
            : colors.primaryForeground
        : variant === "destructive"
          ? colors.destructiveForeground
          : variant === "tinted" || variant === "link"
            ? colors.primary
            : colors.foreground;

    const labelInkStyle = useAnimatedStyle(() => ({
      color: interpolateColor(unlit.value, [0, 1], [lightColor, colors.mutedForeground]),
    }));

    return (
      <AnimatedPressable
        ref={ref}
        disabled={isDisabled}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLayout={handleLayout}
        // sm is 36px visually — expand the hit area to 44pt so it doesn't
        // feel broken. md/lg/icon are exactly 44pt+; hitSlop 2 adds a small
        // buffer for edge misses without overlapping neighbors.
        hitSlop={size === "sm" ? 4 : 2}
        style={press.animatedStyle}
        className={cn(
          buttonVariants({ variant, size, radius }),
          variant === "default" && toneContainer[tone],
          // Busy keeps full strength — the dots say "working", not "unavailable".
          disabled && !filled && "opacity-50",
          className
        )}
        {...a11yProps(
          { accessibilityLabel, accessibilityHint, accessibilityRole, accessibilityState },
          "button"
        )}
        accessibilityState={{ disabled: isDisabled, busy: isLoading, ...accessibilityState }}
        // accessibilityState isn't forwarded to the DOM on web — mirror
        // disabled/busy with explicit aria-* like Switch/Toggle do.
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {variant === "glass" ? (
          <Glass
            effect="regular"
            sheen={0.55}
            bend={0.25}
            interactive
            className="absolute inset-0"
            style={{ borderRadius: radius === "pill" ? 999 : radius === "xl" ? 24 : radius === "lg" ? 16 : 12 }}
            pointerEvents="none"
          />
        ) : null}
        {/* Lit edge — the Lumio material on raised fills */}
        {filled || variant === "secondary" ? (
          <LitEdge
            tone={filled && tone !== "surface" ? "fill" : "surface"}
            radius={radius === "pill" ? 999 : radius === "xl" ? 24 : radius === "lg" ? 16 : 12}
          />
        ) : null}
        {/* Ink overlay — held state */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: inkColor,
            },
            inkStyle,
          ]}
        />
        {ripple && !reduceMotion ? (
          <Animated.View
            pointerEvents="none"
            style={[{ position: "absolute", backgroundColor: inkColor }, rippleStyle]}
          />
        ) : null}

        {/* Unlit layer — the disabled fill, under the label */}
        {filled ? (
          <Animated.View
            pointerEvents="none"
            style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.muted }, unlitStyle]}
          />
        ) : null}

        {/* Label layer — fades/shrinks out when loading starts */}
        <Animated.View
          style={[{ flexDirection: "row", alignItems: "center", gap: 8 }, labelStyle]}
        >
          {icon}
          {isTextualChildren(children) ? (
            <Animated.Text
              className={cn(
                buttonTextVariants({ variant, size }),
                variant === "default" && toneText[tone],
                textClassName
              )}
              style={filled ? labelInkStyle : undefined}
            >
              {children}
            </Animated.Text>
          ) : (
            children
          )}
        </Animated.View>

        {/* Busy — three dots in the label's place, brightening in turn. */}
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: DOT_SIZE }, dotsStyle]}
        >
          {[0, 1, 2].map((i) => (
            <BusyDot key={i} index={i} lap={lap} color={lightColor} still={reduceMotion} />
          ))}
        </Animated.View>
      </AnimatedPressable>
    );
  }
);

Button.displayName = "Button";

/** One busy dot: brightens as the cycle passes its turn, then rests. Opacity
 *  only — the dots never travel, and reduced motion holds them half lit. */
function BusyDot({ index, lap, color, still }: { index: number; lap: SharedValue<number>; color: string; still: boolean }) {
  const style = useAnimatedStyle(() => {
    if (still) return { opacity: 0.6 };
    const t = (((lap.value - index / 3) % 1) + 1) % 1;
    const peak = t < 0.5 ? Math.sin(t * 2 * Math.PI) : 0;
    return { opacity: DOT_REST + (1 - DOT_REST) * Math.max(0, peak) };
  });
  return <Animated.View style={[{ width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2, backgroundColor: color }, style]} />;
}
export { buttonVariants, buttonTextVariants };
