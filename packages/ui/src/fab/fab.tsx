import * as React from "react";
import { forwardRef } from "react";
import { Pressable, Text, View, ActivityIndicator, type PressableProps, type GestureResponderEvent, } from "react-native";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
} from "react-native-reanimated";
import { cn, ease, tempo, useAsyncPress, useHaptic, usePressAnimation, useReducedMotion, useTheme, AnimatedPressable, spring, timing, } from "@lumioui/core";
import { Glass } from "../glass";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface FabProps extends Omit<PressableProps, "style" | "children" | "onPress"> {
  /** Icon rendered inside the button. */
  icon: React.ReactNode;
  /** Extended pill variant: icon + label. */
  extended?: boolean;
  /** Label shown when `extended` is true. */
  label?: string;
  /** Footprint: "md" (56pt, the default) or "sm" (44pt mini for
   *  dense toolbars / secondary surfaces). */
  size?: "sm" | "md";
  /**
   * Position helper. "bottom-right" (default) applies absolute placement
   * above the home indicator; "none" leaves placement to you.
   */
  position?: "bottom-right" | "bottom-left" | "none";
  /** Haptic style on press. Default "medium"; false to disable. */
  haptic?: "light" | "medium" | "heavy" | false;
  /** Crossfade to a spinner and block presses while true. */
  loading?: boolean;
  /** Lumio glass surface — the button floats as a glass disc over
   *  content instead of a filled primary blob. */
  glass?: boolean;
  /** Auto-track async onPress — when onPress returns a Promise, the button
   *  automatically enters loading state until it resolves. Default true. */
  asyncTracking?: boolean;
  /** Called on press. May return a Promise — tracked by asyncTracking. */
  onPress?: (e: GestureResponderEvent) => void | Promise<unknown>;
  /** Held state shown as light: an inner ring brightens once, then holds
   *  lit while true (a paused session, a recording armed). Default false. */
  lit?: boolean;
  className?: string;
}

/** Icon→label gap and pill side padding for the extended FAB (gap-2.5,
 *  px-5 md / px-4 sm). Animated so `extended` can morph the disc into the
 *  pill instead of cutting between two layouts. */
const LABEL_GAP = 10;
const PILL_PAD = { md: 20, sm: 16 } as const;
/** Shape first, then label: the label fades in after a 40ms beat once the
 *  width starts to spring (DESIGN-TASTE §5b stateful-button 40ms beat). */
const LABEL_BEAT_MS = 40;
/** Chrome ignites into place from just under full size — no spark. */
const ENTER_FROM = 0.9;
/** The lit ring settles to this brightness after its one pulse and holds. */
const LIT_HOLD = 0.55;
/** Inset of the lit ring from the disc edge. */
const LIT_INSET = 4;

/**
 * Fab — Floating Action Button.
 * Craft details: safe-area-aware placement (clears the home indicator),
 * weighty 0.92 press spring, an ink overlay while held, and a real
 * drop shadow so it floats above content. It ignites on mount (opacity on
 * timing.fast, 0.9 → 1 on spring.swap) and can carry a held state as light
 * (`lit`). Hosts make it the hero of what it creates — see the variants.
 */
export const Fab = forwardRef<React.ElementRef<typeof Pressable>, FabProps>(
  function Fab(
    {
      icon,
      extended = false,
      label,
      size = "md",
      position = "bottom-right",
      haptic = "medium",
      loading = false,
      asyncTracking = true,
      glass = false,
      lit = false,
      className,
      disabled,
      onPress,
      onPressIn,
      onPressOut,
      accessibilityLabel,
      ...props
    },
    ref
  ) {
    const haptics = useHaptic();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const reduceMotion = useReducedMotion();

    // Auto-track async onPress promises
    const asyncPress = useAsyncPress(
      asyncTracking ? onPress : undefined,
      {
        haptic: haptic ? () => haptics[haptic]() : undefined,
      }
    );
    const isLoading = loading || asyncPress.loading;
    const isDisabled = disabled || isLoading;
    // disabled is folded in here — a className opacity is overridden by the
    // hook's inline animated style on web.
    const press = usePressAnimation({ pressedScale: 0.92, disabled: isDisabled });

    const ink = useSharedValue(0);
    const inkStyle = useAnimatedStyle(() => ({ opacity: ink.value * 0.14 }));
    // Pressed = light crushed out of the surface, flatter face.

    // Mount ignite — light first: opacity on timing.fast while the disc
    // settles 0.9 → 1 on spring.swap. Chrome never sparks. Reduced motion
    // keeps the fade and drops the scale.
    const enterO = useSharedValue(0);
    const enterS = useSharedValue(reduceMotion ? 1 : ENTER_FROM);
    React.useEffect(() => {
      enterO.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
      enterS.value = reduceMotion ? 1 : withSpring(1, spring.swap);
    }, [enterO, enterS, reduceMotion]);
    const enterStyle = useAnimatedStyle(() => ({
      opacity: enterO.value,
      transform: [{ scale: enterS.value }],
    }));

    // Held state as light — the inner ring brightens once, then holds lower.
    const litT = useSharedValue(lit ? LIT_HOLD : 0);
    React.useEffect(() => {
      litT.value = lit
        ? withSequence(
            withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) }),
            withTiming(LIT_HOLD, { duration: tempo.roll, easing: Easing.bezier(...ease.inOut) })
          )
        : withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) });
    }, [lit, litT]);
    const litStyle = useAnimatedStyle(() => ({ opacity: litT.value }));

    // Expand/collapse morph — toggling `extended` springs the label slot's
    // width (measured from a hidden copy) and the pill padding on
    // spring.swap, so the disc stretches into the pill and back. The label
    // fades in after a beat on expand and recedes fast (120ms) on collapse.
    // Only when a label exists; icon-only pills keep the static layout.
    const morph = !!label;
    const isExtended = extended && morph;
    const [labelW, setLabelW] = React.useState(0);
    const extendT = useSharedValue(isExtended ? 1 : 0);
    const labelT = useSharedValue(isExtended ? 1 : 0);
    React.useEffect(() => {
      const target = isExtended ? 1 : 0;
      // Reduced motion: snap the width (no travel), keep the label fade.
      extendT.value = reduceMotion ? target : withSpring(target, spring.swap);
      labelT.value = isExtended
        ? withDelay(reduceMotion ? 0 : LABEL_BEAT_MS, withTiming(1, timing.fast))
        : withTiming(0, timing.recede);
    }, [isExtended, extendT, labelT, reduceMotion]);
    const pad = PILL_PAD[size];
    const pillStyle = useAnimatedStyle(
      () => ({ paddingHorizontal: extendT.value * pad }),
      [pad]
    );
    const labelSlotStyle = useAnimatedStyle(
      () => ({
        width: extendT.value * labelW,
        marginLeft: extendT.value * LABEL_GAP,
        opacity: labelT.value,
      }),
      [labelW]
    );

    // Loading swap — icon and spinner trade places on a quick crossfade with
    // a slight scale settle, instead of a hard content cut.
    const swap = useSharedValue(0);
    React.useEffect(() => {
      swap.value = reduceMotion
        ? isLoading ? 1 : 0
        : withTiming(isLoading ? 1 : 0, timing.fast);
    }, [isLoading, swap, reduceMotion]);
    const iconSwapStyle = useAnimatedStyle(() => ({
      opacity: 1 - swap.value,
      transform: [{ scale: interpolate(swap.value, [0, 1], [1, 0.7]) }],
    }));
    const spinnerSwapStyle = useAnimatedStyle(() => ({
      opacity: swap.value,
      transform: [{ scale: interpolate(swap.value, [0, 1], [0.7, 1]) }],
    }));

    const handlePress = (e: GestureResponderEvent) => {
      if (asyncTracking) {
        asyncPress.handlePress(e);
      } else {
        if (haptic) haptics[haptic]();
        onPress?.(e);
      }
    };
    const handlePressIn = (e: GestureResponderEvent) => {
      press.onPressIn();
      if (!reduceMotion) ink.value = withTiming(1, timing.instant);
      onPressIn?.(e);
    };
    const handlePressOut = (e: GestureResponderEvent) => {
      press.onPressOut();
      ink.value = withTiming(0, timing.normal);
      onPressOut?.(e);
    };

    const positionalStyle =
      position === "none"
        ? undefined
        : {
            position: "absolute" as const,
            bottom: 24 + insets.bottom,
            [position === "bottom-left" ? "left" : "right"]: 24,
          };

    const body = (
      <AnimatedPressable
          ref={ref}
          disabled={isDisabled}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            press.animatedStyle,
            morph ? pillStyle : null,
            glass
              ? undefined
              : {
                  shadowColor: colors.overlay,
                  shadowOpacity: 0.15,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 4,
                },
          ]}
          className={cn(
            "items-center justify-center",
            glass ? "flex-1" : "overflow-hidden",
            glass ? "bg-transparent" : "bg-primary",
            glass && "overflow-hidden",
            morph
              ? // One layout for disc and pill: min-width keeps the
                // collapsed disc square, padding + label slot animate.
                size === "sm"
                  ? "h-11 min-w-11 flex-row rounded-full"
                  : "h-14 min-w-14 flex-row rounded-full"
              : extended
                ? size === "sm"
                  ? "h-11 flex-row rounded-full px-4"
                  : "h-14 flex-row rounded-full px-5"
                : size === "sm"
                  ? "h-11 w-11 rounded-full"
                  : "h-14 w-14 rounded-full",
            !glass && className
          )}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? label ?? "Floating action button"}
          accessibilityState={{ disabled: isDisabled, busy: isLoading }}
          // accessibilityState isn't forwarded to the DOM on web — mirror it.
          aria-disabled={isDisabled}
          aria-busy={isLoading}
          {...props}
        >
                    <Animated.View
            pointerEvents="none"
            style={[
              { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
              inkStyle,
            ]}
            className="bg-primary-foreground"
          />
          <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
              { position: "absolute", top: LIT_INSET, left: LIT_INSET, right: LIT_INSET, bottom: LIT_INSET, borderWidth: 2 },
              litStyle,
            ]}
            className={cn("rounded-full", glass ? "border-foreground" : "border-primary-foreground")}
          />
          {/* Icon/label layer — recedes as the spinner arrives. gap-2.5 moved
              here because the pressable's gap no longer reaches wrapped kids. */}
          <Animated.View
            style={[{ flexDirection: "row", alignItems: "center" }, iconSwapStyle]}
            accessibilityElementsHidden={isLoading}
            importantForAccessibility={isLoading ? "no-hide-descendants" : "auto"}
            // The loading→label swap changes announced content — polite live
            // region so SRs hear the settled label, not the swap frames.
            accessibilityLiveRegion="polite"
            aria-live="polite"
          >
            {icon}
            {morph ? (
              <Animated.View
                // Before the first measurement the slot hugs its label (or is
                // closed) so no frame renders the wrong state.
                style={[
                  { overflow: "hidden" },
                  labelW > 0
                    ? labelSlotStyle
                    : isExtended
                      ? { marginLeft: LABEL_GAP }
                      : { width: 0, opacity: 0 },
                ]}
                accessibilityElementsHidden={!isExtended}
                importantForAccessibility={isExtended ? "auto" : "no-hide-descendants"}
              >
                <Text
                  numberOfLines={1}
                  style={labelW > 0 ? { width: labelW } : undefined}
                  className={cn("text-base font-semibold leading-tight", glass ? "text-foreground" : "text-primary-foreground")}
                >
                  {label}
                </Text>
              </Animated.View>
            ) : null}
          </Animated.View>
          {morph ? (
            // Hidden measuring copy — wide unclipped box so the label lays
            // out at its natural width regardless of the current pill width.
            <View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{ position: "absolute", left: 0, top: 0, width: 1000, opacity: 0, flexDirection: "row" }}
            >
              <Text
                numberOfLines={1}
                onLayout={(e) => {
                  // +1px slack: a fractional width (73.3 → 73) ellipsizes at some densities.
                  const w = Math.ceil(e.nativeEvent.layout.width) + 1;
                  if (w > 0 && w !== labelW) setLabelW(w);
                }}
                className="text-base font-semibold leading-tight"
              >
                {label}
              </Text>
            </View>
          ) : null}
          <Animated.View
            // position is static layout — hoisted out of the animated style.
            style={[{ position: "absolute" }, spinnerSwapStyle]}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            <ActivityIndicator size="small" color={glass ? colors.foreground : colors.primaryForeground} />
          </Animated.View>
        </AnimatedPressable>
    );

    return (
      // Outer wrapper carries the mount pop + placement so the pressable's
      // own scale animation composes cleanly on top of the entrance.
      <Animated.View style={[positionalStyle, enterStyle]}>
        {glass ? (
          <Glass
            interactive
            effect="regular"
            className={cn(
              "overflow-hidden",
              // Glass shell mirrors the pressable's footprint — sm extended
              // was previously forced to the 56pt md height.
              extended
                ? size === "sm" ? "h-11 rounded-full" : "h-14 rounded-full"
                : size === "sm" ? "h-11 w-11 rounded-full" : "h-14 w-14 rounded-full",
              extended && (size === "sm" ? "flex-row px-4" : "flex-row px-5"),
              className
            )}
          >
            {body}
          </Glass>
        ) : (
          body
        )}
      </Animated.View>
    );
  }
);

Fab.displayName = "Fab";
