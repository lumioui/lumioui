import * as React from "react";
import { forwardRef, useState } from "react";
import { View, Text, type ViewProps, type ImageSourcePropType, type GestureResponderEvent, } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { cn, createVariant, useHaptic, usePressAnimation, useReducedMotion, AnimatedPressable, spring, ease, timing } from "@lumioui/core";
import { Icon } from "../icon";

const avatarVariants = createVariant({
  base: "items-center justify-center overflow-hidden rounded-full bg-muted",
  variants: {
    size: {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-14 w-14",
      xl: "h-20 w-20",
    },
  },
  defaultVariants: { size: "md" },
});

const statusColors = {
  online: "bg-success",
  offline: "bg-muted-foreground",
  busy: "bg-destructive",
  away: "bg-warning",
} as const;

/** Wrapper box for the dot — same footprint as the circle so the corner dot
 *  sits on the rim whatever the parent alignment is. */
const boxSize = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14", xl: "h-20 w-20" } as const;

const dotSize = { sm: "h-2.5 w-2.5", md: "h-3 w-3", lg: "h-3.5 w-3.5", xl: "h-4 w-4" } as const;

// Fallback initials track the avatar size — xl with md text looked lost.
const fallbackTextSize = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
  xl: "text-2xl",
} as const;

const fallbackIconSize = { sm: "sm", md: "md", lg: "lg", xl: "xl" } as const;

/** Image settle — the photo fades in while shrinking from a hair oversized,
 * so it reads as landing in the well rather than snapping on (content
 * reveal: short lift, decelerating ease). */
const IMAGE_SETTLE = { duration: timing.normal.duration, easing: Easing.bezier(...ease.out) };

export interface AvatarProps extends ViewProps {
  size?: "sm" | "md" | "lg" | "xl";
  /** Image source for the avatar — fades in when it loads. */
  source?: ImageSourcePropType;
  /** Fallback initials shown when no image (or it fails). */
  fallback?: string;
  /** Presence dot in the corner — chat/status lists. */
  status?: keyof typeof statusColors;
  /** Makes the avatar tappable (profile → detail). */
  onPress?: (e: GestureResponderEvent) => void;
  className?: string;
  /** Accessibility label — defaults to "Avatar". */
  alt?: string;
  /**
   * Presence as light (opt-in): the photo is switched on by presence — full
   * when online or busy, dimmed under a surface veil when away (80%) or
   * offline (60%) — and the dot gets a shape per state (filled online,
   * hollow away, barred busy, hollow grey offline). Default false.
   */
  lit?: boolean;
}

/** Lit mode: how much of the photo is "on" per presence state. */
const PRESENCE_LIGHT: Record<keyof typeof statusColors, number> = {
  online: 1,
  busy: 1,
  away: 0.8,
  offline: 0.6,
};
/** Switching on is quick; dimming away is a calmer shift. */
const PRESENCE_ON = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
const PRESENCE_DIM = { duration: timing.normal.duration, easing: Easing.bezier(...ease.inOut) };

/** Lit-mode dot fill per state — hollow states are rings, busy carries a bar. */
const litDotInner = {
  online: "bg-success",
  away: "border-2 border-warning",
  busy: "bg-destructive items-center justify-center",
  offline: "border-2 border-muted-foreground",
} as const;

/**
 * Avatar — image fades in on load, initials fallback with person glyph,
 * optional presence dot, optional press with spring + haptic. Opt-in `lit`
 * makes presence a light: the photo switches on when online and dims when
 * away or offline, and the dot takes a shape per state.
 */
export const Avatar = forwardRef<React.ElementRef<typeof View>, AvatarProps>(
  function Avatar(
    { size = "md", source, fallback, status, onPress, className, alt = "Avatar", lit = false, ...props },
    ref
  ) {
    const [failed, setFailed] = useState(false);
    const haptics = useHaptic();
    const reduce = useReducedMotion();
    const press = usePressAnimation({ pressedScale: 0.94 });

    const showImage = source && !failed;
    const fade = useSharedValue(0);
    // settleT: 0 = just loaded (slightly oversized), 1 = at rest.
    const settleT = useSharedValue(0);
    const imageStyle = useAnimatedStyle(() => ({
      opacity: fade.value,
      transform: [{ scale: 1.08 - settleT.value * 0.08 }],
    }));

    // A new image source gets a fresh chance to load.
    const sourceKey =
      source && typeof source === "object" && !Array.isArray(source) && "uri" in source
        ? source.uri
        : source;
    React.useEffect(() => {
      setFailed(false);
    }, [sourceKey]);

    // Presence dot: present at rest on first paint (a list of avatars must
    // not pop all at once), then ignites on spring.swap when the status
    // actually changes — the motion marks the change, not the mount.
    const dotPop = useSharedValue(status ? 1 : 0);
    const prevStatus = React.useRef(status);
    React.useEffect(() => {
      if (prevStatus.current === status) return;
      prevStatus.current = status;
      if (!status) {
        dotPop.value = 0;
        return;
      }
      if (reduce) {
        dotPop.value = 1;
        return;
      }
      dotPop.value = 0;
      dotPop.value = withSpring(1, spring.swap);
    }, [status, reduce, dotPop]);
    const dotStyle = useAnimatedStyle(() => ({
      opacity: dotPop.value,
      transform: [{ scale: 0.4 + dotPop.value * 0.6 }],
    }));

    // Lit mode: presence is light on the photo. A surface veil dims it
    // toward the card for away/offline; opacity only, so reduced motion
    // keeps it.
    const veilT = useSharedValue(1 - (status ? PRESENCE_LIGHT[status] : 1));
    React.useEffect(() => {
      if (!lit) return;
      const target = 1 - (status ? PRESENCE_LIGHT[status] : 1);
      veilT.value = withTiming(target, target < veilT.value ? PRESENCE_ON : PRESENCE_DIM);
    }, [lit, status, veilT]);
    const veilStyle = useAnimatedStyle(() => ({ opacity: veilT.value }));

    const veil = lit ? (
      <Animated.View pointerEvents="none" style={veilStyle} className="absolute inset-0 bg-card" />
    ) : null;

    const dot = status ? (
      lit ? (
        // Shape per state — presence never rides on colour alone.
        <Animated.View
          pointerEvents="none"
          style={dotStyle}
          className={cn("absolute bottom-0 right-0 rounded-full border-2 border-card bg-card", dotSize[size])}
          accessibilityElementsHidden
          aria-hidden
        >
          <View className={cn("flex-1 rounded-full", litDotInner[status])}>
            {status === "busy" ? <View className="w-1/2 rounded-full bg-destructive-foreground" style={{ height: 2 }} /> : null}
          </View>
        </Animated.View>
      ) : (
        <Animated.View
          pointerEvents="none"
          style={dotStyle}
          className={cn(
            // Ring matches the surface avatars almost always sit on (list rows,
            // cards) so the dot reads as cut out of the photo.
            "absolute bottom-0 right-0 rounded-full border-2 border-card",
            dotSize[size],
            statusColors[status]
          )}
          accessibilityElementsHidden
          aria-hidden
        />
      )
    ) : null;

    const content = (
      <>
        {showImage ? (
          <>
            {/* Initials stay under the image until it loads — no blank flash */}
            <Text
              className={cn("absolute font-semibold leading-tight text-muted-foreground", fallbackTextSize[size])}
              allowFontScaling={false}
            >
              {(fallback ?? "?").slice(0, 2).toUpperCase()}
            </Text>
            <Animated.Image
              source={source}
              className="h-full w-full"
              style={imageStyle}
              onLoad={() => {
                if (reduce) {
                  fade.value = 1;
                  settleT.value = 1;
                } else {
                  fade.value = withTiming(1, timing.normal);
                  settleT.value = withTiming(1, IMAGE_SETTLE);
                }
              }}
              onError={() => setFailed(true)}
              accessibilityIgnoresInvertColors
            />
          </>
        ) : fallback ? (
          <Text className={cn("font-semibold leading-tight text-muted-foreground", fallbackTextSize[size])} allowFontScaling={false}>
            {fallback.slice(0, 2).toUpperCase()}
          </Text>
        ) : (
          <Icon name="user" size={fallbackIconSize[size]} color="mutedForeground" />
        )}
        {veil}
      </>
    );

    const container = cn(avatarVariants({ size }), className);
    const a11y = {
      accessibilityLabel: alt,
      accessibilityRole: (onPress ? "button" : "image") as "button" | "image",
    };

    // The circle clips its photo (overflow-hidden), so the presence dot lives
    // on an unclipped wrapper — inside the circle the corner dot was masked
    // down to a sliver.
    const withDot = (node: React.ReactElement) =>
      dot ? (
        <View className={cn("relative", boxSize[size])}>
          {node}
          {dot}
        </View>
      ) : (
        node
      );

    if (!onPress) {
      return withDot(
        <View ref={ref} className={container} {...a11y} {...props}>
          {content}
        </View>
      );
    }

    return withDot(
      <AnimatedPressable
        ref={ref as never}
        onPress={(e) => {
          haptics.light();
          onPress(e);
        }}
        // sm/md avatars are below the 44pt target — expand the hit area.
        hitSlop={size === "sm" || size === "md" ? 6 : 0}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={press.animatedStyle}
        className={container}
        {...a11y}
        {...props}
      >
        {content}
      </AnimatedPressable>
    );
  }
);

Avatar.displayName = "Avatar";
