import * as React from "react";
import { forwardRef } from "react";
import { Platform, StyleSheet, View, Text, type ViewProps, type TextProps, type ViewStyle, type GestureResponderEvent, } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import {
  cn,
  useHaptic,
  usePressAnimation,
  AnimatedPressable,
  LitEdge,
  SwitchOn,
  BAND_STAGGER,
  timing,
  useTheme,
} from "@lumioui/core";
import { Glass } from "../glass";

/**
 * Card — compound component:
 *   <Card>
 *     <Card.Header><Card.Title /><Card.Description /></Card.Header>
 *     <Card.Content />
 *     <Card.Footer />
 *   </Card>
 *
 * Pass `onPress` to make the whole card a tactile surface —
 * it scales down slightly, fires a light haptic, and exposes
 * button accessibility semantics.
 */

export interface CardProps extends ViewProps {
  className?: string;
  /** Surface voice — "elevated" (default, soft shadow on card color),
   *  "outlined" (hairline border, no shadow — the paper-canvas idiom),
   *  "filled" (tonal secondary fill, no shadow),
   *  "glass" (glass material — floating panels over content). */
  variant?: "elevated" | "outlined" | "filled" | "glass";
  /** Makes the card pressable: spring scale + light haptic. */
  onPress?: (e: GestureResponderEvent) => void;
  /** Haptic on press. Default "light"; false to disable. */
  haptic?: "light" | "medium" | "heavy" | "selection" | false;
  disabled?: boolean;
  /**
   * Switch the card on as it mounts (opt-in): its parts start dim, then
   * each direct child switches on in reading order. Default false.
   */
  appear?: boolean;
  /**
   * Pressable cards only (opt-in): the lit edge brightens with press depth
   * (to ~1.6× its strength) as well as the scale dip. Default false.
   */
  pressLight?: boolean;
}

/** Appear: parts switch on in reading order on the band rhythm. */
const APPEAR_LEAD = timing.instant.duration;
/** Extra lit-edge strength at full press depth (1 → 1.6). */
const PRESS_LIGHT = 0.6;

// `shadow-card` is a custom boxShadow that only exists on web — native gets
// the same soft lift via shadow* + elevation (button.tsx pattern: the palette
// has no shadow token, so black under both schemes is intentional).
const nativeShadow: ViewStyle | undefined =
  Platform.OS === "web"
    ? undefined
    : {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      };

const cardVariants = {
  elevated: "rounded-2xl bg-card shadow-card",
  // One depth treatment per scheme: hairline on light, surface lightness on dark.
  outlined: "rounded-2xl border border-border bg-card dark:border-transparent",
  filled: "rounded-2xl bg-secondary",
  glass: "rounded-2xl",
} as const;

const CardRoot = forwardRef<React.ElementRef<typeof View>, CardProps>(
  function Card(
    {
      className,
      variant = "elevated",
      onPress,
      haptic = "light",
      disabled,
      appear = false,
      pressLight = false,
      children: childrenProp,
      style,
      ...props
    },
    ref
  ) {
    const haptics = useHaptic();
    const press = usePressAnimation({ pressedScale: 0.98 });
    // Ink wash — the same held-state veil as List.Item/Fab, so the surface
    // confirms the touch even before the scale settles. Opacity-only, so it
    // stays as feedback under reduced motion.
    const ink = useSharedValue(0);
    const inkStyle = useAnimatedStyle(() => ({ opacity: ink.value * 0.05 }));
    const pressLightStyle = useAnimatedStyle(() => ({ opacity: ink.value }));

    const { scheme } = useTheme();
    // Appear: each part switches on in reading order.
    const children = appear
      ? React.Children.toArray(childrenProp).map((child, i) => (
          <SwitchOn key={i} delay={APPEAR_LEAD + i * BAND_STAGGER}>
            {child}
          </SwitchOn>
        ))
      : childrenProp;

    const surface = cn(
      // Tonal surface — the tinted `background` canvas supplies the edge,
      // shadow-card supplies the lift (native gets `nativeShadow` above).
      // No p-0 (View has no padding by default) and no shadow-sm (web preset looks dirty on native).
      cardVariants[variant],
      disabled && "opacity-50",
      className
    );
    // A black drop shadow on a near-black canvas is dead weight: dark lifts
    // by surface lightness alone.
    const lift = variant === "elevated" && scheme !== "dark" ? nativeShadow : undefined;
    const glass = variant === "glass";
    // Lit edge on raised tonal surfaces. A caller radius override (rounded-*)
    // would leave the 16pt highlight corners outside the curve, so skip it.
    const lit = (variant === "elevated" || variant === "filled") && !/\brounded-/.test(className ?? "");

    if (!onPress) {
      return (
        <View ref={ref} className={surface} style={[lift, style]} {...props}>
          {glass ? (
            <Glass
              effect="regular"
              sheen={0.4}
              className="absolute inset-0 rounded-2xl"
            />
          ) : null}
          {children}
          {lit ? <LitEdge tone="surface" radius={16} /> : null}
        </View>
      );
    }

    return (
      <AnimatedPressable
        ref={ref}
        disabled={disabled}
        onPress={(e) => {
          if (haptic) haptics[haptic]();
          onPress(e);
        }}
        onPressIn={() => {
          press.onPressIn();
          ink.value = withTiming(1, timing.instant);
        }}
        onPressOut={() => {
          press.onPressOut();
          ink.value = withTiming(0, timing.normal);
        }}
        style={[press.animatedStyle, lift, style]}
        className={surface}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled ?? false }}
        // RNW drops the accessibilityState object — mirror as aria-*.
        aria-disabled={disabled ?? false}
        {...props}
      >
        {glass ? (
          <Glass
            effect="regular"
            sheen={0.4}
            className="absolute inset-0 rounded-2xl"
          />
        ) : null}
        <Animated.View
          pointerEvents="none"
          style={inkStyle}
          className="absolute inset-0 rounded-2xl bg-foreground"
          accessibilityElementsHidden
          aria-hidden
        />
        {children}
        {lit ? <LitEdge tone="surface" radius={16} /> : null}
        {lit && pressLight ? (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, pressLightStyle]}>
            <LitEdge tone="surface" radius={16} strength={PRESS_LIGHT} />
          </Animated.View>
        ) : null}
      </AnimatedPressable>
    );
  }
);

const CardHeader = forwardRef<React.ElementRef<typeof View>, CardProps>(
  function CardHeader({ className, ...props }, ref) {
    // 20px rhythm (p-5) — p-6 felt cavernous on a 350px phone column.
    // `relative` is the default RN position; CardAction anchors to it.
    return <View ref={ref} className={cn("relative gap-1.5 p-5", className)} {...props} />;
  }
);

const CardAction = forwardRef<React.ElementRef<typeof View>, CardProps>(
  function CardAction({ className, ...props }, ref) {
    // The header's top-right action slot (menus, "see all").
    // Render inside <Card.Header>; absolutely pinned so it never shifts
    // the title/description column.
    return (
      <View
        ref={ref}
        className={cn("absolute right-5 top-5", className)}
        {...props}
      />
    );
  }
);

export interface CardTextProps extends TextProps {
  className?: string;
}

const CardTitle = forwardRef<React.ElementRef<typeof Text>, CardTextProps>(
  function CardTitle({ className, ...props }, ref) {
    return (
      <Text
        ref={ref}
        // leading-tight (1.25) — leading-none clipped descenders (g, y, p).
        // 18pt — the card-title rung (DESIGN-TASTE §2); 20 shouted on a
        // phone column next to 15–16pt rows.
        className={cn("text-lg font-semibold leading-tight text-card-foreground", className)}
        accessibilityRole="header"
        {...props}
      />
    );
  }
);

const CardDescription = forwardRef<React.ElementRef<typeof Text>, CardTextProps>(
  function CardDescription({ className, ...props }, ref) {
    return (
      <Text ref={ref} className={cn("text-[15px] leading-5 text-muted-foreground", className)} {...props} />
    );
  }
);

const CardContent = forwardRef<React.ElementRef<typeof View>, CardProps>(
  function CardContent({ className, ...props }, ref) {
    return <View ref={ref} className={cn("p-5 pt-0", className)} {...props} />;
  }
);

const CardFooter = forwardRef<React.ElementRef<typeof View>, CardProps>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <View
        ref={ref}
        className={cn("flex-row items-center gap-3 p-5 pt-0", className)}
        {...props}
      />
    );
  }
);

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Action: CardAction,
  Content: CardContent,
  Footer: CardFooter,
});
Card.displayName = "Card";
CardHeader.displayName = "CardHeader";
CardAction.displayName = "CardAction";
CardTitle.displayName = "CardTitle";
CardDescription.displayName = "CardDescription";
CardContent.displayName = "CardContent";
CardFooter.displayName = "CardFooter";
