import * as React from "react";
import { forwardRef, useCallback } from "react";
import {
  Image,
  Platform,
  Pressable,
  View,
  type ImageSourcePropType,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { cn, spring, timing, useHaptic, useReducedMotion, useTheme } from "@lumioui/core";

/**
 * Sticker — a die-cut vinyl sticker: your image or content inside a white
 * cut edge, set down at a slight tilt with a soft shadow. Press it and it
 * lifts off the page: it rises, straightens a little, its shadow deepens and
 * one corner peels back to show the white backing. Release and it lays flat.
 *
 *   <Sticker image={{ uri }} shape="circle" tilt={-6} />
 *   <Sticker shape="pill" contentClassName="bg-primary px-4 py-2" peel={0.4}>
 *     <Text className="font-bold text-primary-foreground">Lisboa</Text>
 *   </Sticker>
 *
 * The paper family (Tape, Polaroid, PostageStamp, PaperClip) shares the lift,
 * shadows and handwriting face exported here. Expo Go compatible.
 */

// ---------------------------------------------------------------------------
// Shared paper language
// ---------------------------------------------------------------------------

/** A handwriting face from the system — no font files to ship. Noteworthy on
 *  Apple platforms, the casual face on Android, a cursive stack on the web. */
export const HANDWRITING: string =
  Platform.select({
    ios: "Noteworthy-Bold",
    android: "casual",
    default: '"Noteworthy", "Bradley Hand", "Segoe Print", "Chalkboard SE", cursive',
  }) ?? "cursive";

/** Paper is a physical object, so it keeps its own colour in both schemes —
 *  dark mode only takes the glare off so it doesn't burn on a black canvas. */
export const PAPER = {
  /** Sticker vinyl edge. */
  vinyl: { light: "#FFFFFF", dark: "#F2F1EE" },
  /** Photo and stamp stock — a warm white. */
  stock: { light: "#FCFBF8", dark: "#E9E7E2" },
  /** Brown kraft — tabs, tape, envelopes. */
  kraft: { light: "#D6B98C", dark: "#C4A87C" },
  /** Pen ink on paper. Paper stays light, so ink stays dark. */
  ink: "#2B2926",
  /** The back of a sticker or a curled corner. */
  backing: "#E4E2DD",
} as const;

/** Resting and lifted shadows for paper on a surface — black under both
 *  schemes on purpose (a real shadow, not a coloured glow). The web gets a
 *  two-layer boxShadow; native the same lift via shadow* + elevation. */
export function paperShadow(lifted: boolean): ViewStyle {
  if (Platform.OS === "web") {
    return {
      boxShadow: lifted
        ? "0 14px 28px rgba(0,0,0,0.16), 0 4px 10px rgba(0,0,0,0.10)"
        : "0 1px 2px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.08)",
    };
  }
  return lifted
    ? { shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 10 }, elevation: 10 }
    : { shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 };
}

export interface PaperLiftOptions {
  /** Resting tilt in degrees. */
  tilt: number;
  /** Points the paper rises while held. */
  rise?: number;
  /** Scale while held. */
  grow?: number;
  /** Share of the tilt taken out while held (0 keeps it, 1 straightens). */
  straighten?: number;
  /** Extra degrees of rotation added while held (a swing away from the tilt). */
  swing?: number;
  /** Fire the selection haptic as the paper lifts. Default true. */
  haptic?: boolean;
  disabled?: boolean;
}

/**
 * usePaperLift — the family's one press: lift on touch-down (spring.press,
 * so the paper answers the finger at once), lay back down on release
 * (spring.surface, a calm settle with no bounce). `lift` runs 0 → 1 and
 * drives shadows and peels. Reduced motion keeps the shadow change and drops
 * the rise, scale and straightening.
 */
export function usePaperLift({
  tilt,
  rise = 3,
  grow = 1.03,
  straighten = 0.5,
  swing = 0,
  haptic = true,
  disabled = false,
}: PaperLiftOptions) {
  const reduce = useReducedMotion();
  const haptics = useHaptic(haptic);
  const lift = useSharedValue(0);

  const onPressIn = useCallback(() => {
    if (disabled) return;
    haptics.selection();
    lift.value = reduce ? withTiming(1, timing.fast) : withSpring(1, spring.press);
  }, [disabled, haptics, lift, reduce]);

  const onPressOut = useCallback(() => {
    lift.value = reduce ? withTiming(0, timing.recede) : withSpring(0, spring.surface);
  }, [lift, reduce]);

  const surfaceStyle = useAnimatedStyle(() => {
    const l = reduce ? 0 : lift.value;
    return {
      transform: [
        { translateY: -rise * l },
        { rotate: `${tilt * (1 - straighten * l) + swing * l}deg` },
        { scale: 1 + (grow - 1) * l },
      ],
    };
  }, [reduce, tilt, rise, grow, straighten, swing]);

  const liftShadowStyle = useAnimatedStyle(() => ({ opacity: lift.value }));

  return { lift, reduce, onPressIn, onPressOut, surfaceStyle, liftShadowStyle };
}

// ---------------------------------------------------------------------------
// Sticker
// ---------------------------------------------------------------------------

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/** Corner box of the peel, in points. The fold runs across its diagonal. */
const PEEL_SIZE = 28;
/** The curled corner's rounded tip, as a share of the peel box. */
const PEEL_TIP = 0.32;

const RADIUS = { rounded: 22, circle: 9999, pill: 9999 } as const;

export interface StickerProps
  extends Omit<PressableProps, "children" | "style" | "accessibilityRole"> {
  className?: string;
  /** Sticker content — text, an icon, a small layout. Ignored when `image` is set. */
  children?: React.ReactNode;
  /** Image printed on the sticker. */
  image?: ImageSourcePropType;
  /** Image side in points (square). Default 112. */
  size?: number;
  /** Die-cut outline. Default "rounded". */
  shape?: "rounded" | "circle" | "pill";
  /** White cut edge in points. Default 6. */
  edge?: number;
  /** Resting tilt in degrees. Default -4. */
  tilt?: number;
  /** How far the corner is already peeled at rest, 0–1. Default 0 — it only
   *  peels while pressed. A resting peel shows `backdrop` under the corner. */
  peel?: number;
  /** Which corner peels. Default "bottom-right". */
  peelCorner?: Corner;
  /** Colour under the peeled corner — the page the sticker sits on. Default
   *  the theme background. */
  backdrop?: string;
  /** Classes for the inner face (background, padding) when using children. */
  contentClassName?: string;
  /** Selection haptic as it lifts. Default true. */
  haptic?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const Sticker = forwardRef<React.ElementRef<typeof Pressable>, StickerProps>(
  function Sticker(
    {
      className,
      children,
      image,
      size = 112,
      shape = "rounded",
      edge = 6,
      tilt = -4,
      peel = 0,
      peelCorner = "bottom-right",
      backdrop,
      contentClassName,
      haptic = true,
      disabled,
      onPress,
      onPressIn,
      onPressOut,
      accessibilityLabel,
      ...props
    },
    ref
  ) {
    const { colors, scheme } = useTheme();
    const { lift, reduce, onPressIn: liftIn, onPressOut: liftOut, surfaceStyle, liftShadowStyle } =
      usePaperLift({ tilt, haptic, disabled: !!disabled });

    const vinyl = PAPER.vinyl[scheme];
    const outer = RADIUS[shape];
    const inner = shape === "rounded" ? Math.max(4, outer - edge) : 9999;
    // A peel on a round die-cut has no corner to lift — circles and pills only rise.
    const canPeel = shape === "rounded";
    const resting = Math.min(1, Math.max(0, peel));

    const peelStyle = useAnimatedStyle(() => {
      const p = resting + (1 - resting) * lift.value;
      // Reduced motion: the curl fades in at its full size instead of growing.
      return {
        opacity: Math.min(1, p * 6),
        transform: [{ scale: reduce ? 1 : p }],
      };
    }, [reduce, resting]);

    const bottom = peelCorner.startsWith("bottom");
    const right = peelCorner.endsWith("right");
    const peelPos: ViewStyle = {
      position: "absolute",
      width: PEEL_SIZE,
      height: PEEL_SIZE,
      [bottom ? "bottom" : "top"]: 0,
      [right ? "right" : "left"]: 0,
      transformOrigin: `${right ? "100%" : "0%"} ${bottom ? "100%" : "0%"}`,
    };
    const flip = { transform: [{ scaleX: right ? 1 : -1 }, { scaleY: bottom ? 1 : -1 }] };
    const F = PEEL_SIZE;
    const tip = F * PEEL_TIP;
    const gradId = React.useId().replace(/:/g, "");

    return (
      <Pressable
        ref={ref}
        disabled={disabled}
        onPress={onPress}
        onPressIn={(e) => {
          liftIn();
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          liftOut();
          onPressOut?.(e);
        }}
        // Decorative vinyl with nothing to say stays out of the screen-reader order.
        accessible={!!onPress || !!accessibilityLabel}
        accessibilityRole={onPress ? "button" : image ? "image" : undefined}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={onPress ? { disabled: !!disabled } : undefined}
        className={cn("self-start", className)}
        {...props}
      >
        <Animated.View style={surfaceStyle}>
          <Animated.View
            pointerEvents="none"
            className="absolute inset-0"
            style={[{ borderRadius: outer, backgroundColor: vinyl }, paperShadow(true), liftShadowStyle]}
          />
          <View style={[{ borderRadius: outer, backgroundColor: vinyl, padding: edge }, paperShadow(false)]}>
            <View
              className={cn("items-center justify-center overflow-hidden", !image && contentClassName)}
              style={{ borderRadius: inner }}
            >
              {image ? (
                <Image source={image} style={{ width: size, height: size }} resizeMode="cover" />
              ) : (
                children
              )}
            </View>
          </View>
          {canPeel ? (
            <Animated.View pointerEvents="none" style={[peelPos, peelStyle]}>
              <View style={[{ width: F, height: F }, flip]}>
                <Svg width={F} height={F}>
                  <Defs>
                    <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor={PAPER.backing} />
                      <Stop offset="1" stopColor="#FFFFFF" />
                    </LinearGradient>
                  </Defs>
                  {/* The page shows where the corner left it. */}
                  <Path d={`M${F} 0 L${F} ${F} L0 ${F} Z`} fill={backdrop ?? colors.background} />
                  {/* The curl's shadow on the sticker face. */}
                  <Path d={`M0 ${F} L${F} 0 L${tip} 0 Q0 0 0 ${tip} Z`} fill="#000" opacity={0.14} transform="translate(-1.5 -1.5)" />
                  {/* The curled corner, white backing up. */}
                  <Path d={`M0 ${F} L${F} 0 L${tip} 0 Q0 0 0 ${tip} Z`} fill={`url(#${gradId})`} />
                </Svg>
              </View>
            </Animated.View>
          ) : null}
        </Animated.View>
      </Pressable>
    );
  }
);

Sticker.displayName = "Sticker";
