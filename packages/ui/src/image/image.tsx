import * as React from "react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Image as RNImage,
  type ImageProps as RNImageProps,
} from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS, Easing } from "react-native-reanimated";
import { cn, createVariant, ease, timing, useReducedMotion } from "@lumioui/core";

/** Image switch-on (DESIGN-TASTE §0b, §5c rule 6): the frame waits as a steady
 * dim tile; the photo arrives dim and brightens into place. */
const ARRIVE = { ...timing.normal, easing: Easing.bezier(...ease.out) };
/** The brightening runs a beat longer than the arrival so the photo is seen switching on. */
const BRIGHTEN = { ...timing.slow, easing: Easing.bezier(...ease.out) };
/** How dim the photo is when it first appears. */
const DIM = 0.4;

/**
 * Image — RN Image wrapper with rounded variants, aspectRatio,
 * a still, dim frame while loading (nothing moves across it, however slow
 * the load), a switch-on arrival, and an error fallback slot.
 *   <Image source={{ uri }} rounded="lg" aspectRatio={16/9} fallback={<Text>!</Text>} />
 */

const imageVariants = createVariant({
  base: "overflow-hidden bg-muted",
  variants: {
    rounded: {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      // Media tiles and cards (DESIGN-TASTE §3: tiles/media 16–20).
      "2xl": "rounded-2xl",
      "3xl": "rounded-3xl",
      full: "rounded-full",
    },
  },
  defaultVariants: { rounded: "md" },
});

export interface ImageProps extends Omit<RNImageProps, "style" | "className" | "children"> {
  /** Corner radius preset. */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  /** width / height ratio applied via style. */
  aspectRatio?: number;
  /** Slot rendered when the image fails to load. */
  fallback?: React.ReactNode;
  /** Hide the loading placeholder. Default false. */
  hidePlaceholder?: boolean;
  /**
   * Alt text for the image — alias for `accessibilityLabel`. When neither is
   * provided the label is left unset so the OS can decide what to announce.
   */
  alt?: string;
  className?: string;
  style?: RNImageProps["style"];
}

export const Image = forwardRef<React.ElementRef<typeof RNImage>, ImageProps>(
  function Image(
    {
      rounded = "md",
      aspectRatio,
      fallback,
      hidePlaceholder = false,
      alt,
      accessibilityLabel,
      className,
      style,
      onLoad,
      onError,
      ...props
    },
    ref
  ) {
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    // Drop the animated style entirely once the reveal settles — a lingering
    // `transform: scale(1)` keeps the element composited on web, which paints
    // it above absolutely-positioned siblings (floating chrome).
    const [revealed, setRevealed] = useState(false);
    // Placeholder stays mounted through its fade-out — hiding it on the same
    // frame the image loads would hard-cut the crossfade.
    const [showPlaceholder, setShowPlaceholder] = useState(!hidePlaceholder);
    const reduce = useReducedMotion();
    // frame: 1 while waiting, fades out under the arriving photo.
    const frame = useSharedValue(1);
    // arrive: photo opacity; lit: how far it has brightened.
    const arrive = useSharedValue(0);
    const lit = useSharedValue(0);

    useEffect(() => {
      if (!loading || failed || hidePlaceholder) return;
      setShowPlaceholder(true);
    }, [loading, failed, hidePlaceholder]);

    const placeholderStyle = useAnimatedStyle(() => ({ opacity: frame.value }));
    const imageStyle = useAnimatedStyle(() => ({ opacity: arrive.value }));
    const veilStyle = useAnimatedStyle(() => ({ opacity: (1 - lit.value) * DIM }));

    // Load handlers must keep one identity across renders: on the web the
    // image restarts its request whenever onLoad/onError change, so a parent
    // that re-renders often (a ticking player, a live clock) would abort the
    // load every tick and the photo would never arrive. Latest values ride refs.
    const latest = useRef({ onLoad, onError, reduce });
    latest.current = { onLoad, onError, reduce };

    const switchOn = (instant: boolean) => {
      if (instant) {
        arrive.value = withTiming(1, timing.fast);
        lit.value = 1;
        frame.value = 0;
        setShowPlaceholder(false);
        setRevealed(true);
        return;
      }
      arrive.value = withTiming(1, ARRIVE);
      frame.value = withTiming(0, ARRIVE, (finished) => {
        if (finished) runOnJS(setShowPlaceholder)(false);
      });
      lit.value = withTiming(1, BRIGHTEN, (finished) => {
        if (finished) runOnJS(setRevealed)(true);
      });
    };

    const handleLoad = useCallback(
      (e: Parameters<NonNullable<ImageProps["onLoad"]>>[0]) => {
        switchOn(latest.current.reduce);
        setLoading(false);
        latest.current.onLoad?.(e);
      },
      // switchOn only touches shared values and state setters, which are stable.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );
    const handleError = useCallback(
      (e: Parameters<NonNullable<ImageProps["onError"]>>[0]) => {
        arrive.value = 1;
        lit.value = 1;
        setRevealed(true);
        setLoading(false);
        setFailed(true);
        latest.current.onError?.(e);
      },
      [arrive, lit]
    );

    return (
      <View
        className={cn(imageVariants({ rounded }), "w-full", className)}
        style={aspectRatio != null ? { aspectRatio } : undefined}
        accessibilityRole="image"
        // No generic "Image" fallback — an absent label lets the OS decide.
        accessibilityLabel={alt ?? accessibilityLabel}
      >
        {!failed ? (
          <Animated.Image
            ref={ref}
            className="h-full w-full"
            style={[style, revealed ? undefined : imageStyle]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-muted">
            {fallback ?? null}
          </View>
        )}
        {/* Dim at first, the photo brightens as this veil lifts. */}
        {!failed && !revealed ? (
          <Animated.View pointerEvents="none" style={veilStyle} className="absolute inset-0 bg-black" accessibilityElementsHidden importantForAccessibility="no" />
        ) : null}
        {showPlaceholder && !failed && (
          <Animated.View
            pointerEvents="none"
            style={placeholderStyle}
            className="absolute inset-0 bg-muted"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        )}
      </View>
    );
  }
);

Image.displayName = "Image";
export { imageVariants };
