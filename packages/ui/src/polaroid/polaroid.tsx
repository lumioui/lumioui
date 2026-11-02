import * as React from "react";
import { forwardRef, useEffect } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  type ImageSourcePropType,
  type PressableProps,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { cn, ease, tempo, useTheme } from "@lumioui/core";
import { HANDWRITING, PAPER, paperShadow, usePaperLift } from "../sticker";

/**
 * Polaroid — an instant photo: a square print in a white frame with a deep
 * bottom margin for a handwritten caption, set down at a slight tilt. The
 * print develops when its image arrives — it starts as dim, still-readable
 * film and clears to full colour. Press it to pick it up: it rises,
 * straightens toward you and its shadow deepens, then it settles back.
 *
 *   <Polaroid image={{ uri }} caption="Alfama, 6am" tilt={-3} />
 *   <Polaroid width={160} aspectRatio={4 / 5} caption={<MyCaption />}>
 *     <MapThumbnail />
 *   </Polaroid>
 *
 * Expo Go compatible.
 */

/** Developing is a slow reveal by nature — two roll periods, so it reads as
 *  the film clearing rather than an image loading in. */
const DEVELOP_MS = tempo.roll * 2;
/** Film veil at the start of developing — dim, never blank. */
const VEIL_START = 0.72;
/** Undeveloped film: a warm dark grey. */
const FILM = "#2E2B27";

export interface PolaroidProps
  extends Omit<PressableProps, "children" | "style" | "accessibilityRole"> {
  className?: string;
  /** The photo. */
  image?: ImageSourcePropType;
  /** Any content in place of a photo (a map, an illustration). */
  children?: React.ReactNode;
  /** Handwritten caption — a string is set in the handwriting face; pass a
   *  node for your own. */
  caption?: React.ReactNode;
  /** Frame width in points. Default 188. */
  width?: number;
  /** Print width / height. Default 1 (square). */
  aspectRatio?: number;
  /** Resting tilt in degrees. Default 2. */
  tilt?: number;
  /** Develop the print when the image arrives. Default true. */
  develop?: boolean;
  /** Selection haptic as it lifts. Default true. */
  haptic?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const Polaroid = forwardRef<React.ElementRef<typeof Pressable>, PolaroidProps>(
  function Polaroid(
    {
      className,
      image,
      children,
      caption,
      width = 188,
      aspectRatio = 1,
      tilt = 2,
      develop = true,
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
    const { scheme } = useTheme();
    const { onPressIn: liftIn, onPressOut: liftOut, surfaceStyle, liftShadowStyle } = usePaperLift({
      tilt,
      rise: 4,
      straighten: 0.6,
      haptic,
      disabled: !!disabled,
    });

    const side = Math.round(width * 0.06);
    const bottom = Math.round(width * 0.25);
    const printW = width - side * 2;
    const printH = Math.round(printW / aspectRatio);
    const stock = PAPER.stock[scheme];

    const veil = useSharedValue(develop ? VEIL_START : 0);
    const reveal = React.useCallback(() => {
      veil.value = withTiming(0, { duration: DEVELOP_MS, easing: Easing.bezier(...ease.out) });
    }, [veil]);
    // Content prints have nothing to load — they develop on mount.
    useEffect(() => {
      if (develop && !image) reveal();
    }, [develop, image, reveal]);
    const veilStyle = useAnimatedStyle(() => ({ opacity: veil.value }));

    const label =
      accessibilityLabel ?? (typeof caption === "string" ? `Photo: ${caption}` : "Photo");
    // Long captions shrink to fit, but never below 12pt.
    const captionSize = Math.max(14, Math.round(width * 0.09));

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
        accessibilityRole={onPress ? "button" : "image"}
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
        className={cn("self-start", className)}
        {...props}
      >
        <Animated.View style={surfaceStyle}>
          <Animated.View
            pointerEvents="none"
            className="absolute inset-0 rounded-[3px]"
            style={[{ backgroundColor: stock }, paperShadow(true), liftShadowStyle]}
          />
          <View
            className="rounded-[3px]"
            style={[{ width, paddingTop: side, paddingHorizontal: side, backgroundColor: stock }, paperShadow(false)]}
          >
            <View className="overflow-hidden" style={{ width: printW, height: printH, backgroundColor: FILM }}>
              {image ? (
                <Image
                  source={image}
                  onLoad={develop ? reveal : undefined}
                  onError={develop ? reveal : undefined}
                  style={{ width: printW, height: printH }}
                  resizeMode="cover"
                />
              ) : (
                children
              )}
              {develop ? (
                <Animated.View
                  pointerEvents="none"
                  className="absolute inset-0"
                  style={[{ backgroundColor: FILM }, veilStyle]}
                />
              ) : null}
            </View>
            <View className="items-center justify-center px-1" style={{ height: bottom }}>
              {typeof caption === "string" ? (
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={12 / captionSize}
                  style={{ fontFamily: HANDWRITING, fontSize: captionSize, color: PAPER.ink }}
                >
                  {caption}
                </Text>
              ) : (
                caption
              )}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  }
);

Polaroid.displayName = "Polaroid";
